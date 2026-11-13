const ResourceRequest = require('../models/ResourceRequest');
const Hospital = require('../models/Hospital');
const { notify, emitTo, emitAll } = require('../utils/notify');
const {
  sendError,
  isValidObjectId,
  toPositiveInt,
  bloodGroupToKey,
  bloodKeyToLabel,
  parsePagination,
} = require('../utils/http');

const RESOURCE_TYPES = ResourceRequest.schema.path('resourceType').enumValues;
const PRIORITIES = ResourceRequest.schema.path('priority').enumValues;
const MAX_QUANTITY = 10000;

// Statuses in which the providing hospital's stock has already been deducted.
const STOCK_RESERVED_STATUSES = ['accepted', 'partially_fulfilled', 'in_transit'];

/**
 * Inventory fields for the resource types whose stock is tracked on the Hospital
 * document. Medicines, oxygen and ambulances are coordinated but not counted.
 */
const TRACKED_RESOURCES = {
  icuBeds: { available: 'beds.icuAvailable', total: 'beds.icuTotal' },
  emergencyBeds: { available: 'beds.emergencyAvailable', total: 'beds.emergencyTotal' },
  ventilators: { available: 'beds.ventilatorsAvailable', total: 'beds.ventilatorsTotal' },
};

const isTracked = (resourceType) => resourceType === 'beds' || resourceType === 'blood' || !!TRACKED_RESOURCES[resourceType];

const availablePath = (resourceType, details) => {
  if (resourceType === 'beds') return 'beds.available';
  if (resourceType === 'blood') {
    const key = bloodGroupToKey(details && details.bloodGroup);
    return key ? `bloodInventory.${key}.availableUnits` : null;
  }
  return TRACKED_RESOURCES[resourceType] ? TRACKED_RESOURCES[resourceType].available : null;
};

const getAvailableUnits = (hospital, resourceType, details) => {
  const path = availablePath(resourceType, details);
  if (!path) return null;
  return Number(hospital.get(path)) || 0;
};

const describeResource = (request) => {
  if (request.resourceType === 'blood' && request.details && request.details.bloodGroup) {
    return `blood (${bloodKeyToLabel(request.details.bloodGroup)})`;
  }
  if (request.resourceType === 'medicines' && request.details && request.details.medicineName) {
    return `medicines (${request.details.medicineName})`;
  }
  return request.resourceType;
};

/**
 * Atomically remove `qty` units from a hospital's stock. Returns false when the
 * hospital does not have enough units (the filter guarantees stock never goes
 * negative, even when two requests are accepted at the same moment).
 */
const deductStock = async (hospitalId, resourceType, details, qty) => {
  if (!isTracked(resourceType)) return true;

  if (resourceType === 'beds') {
    // Reserve general beds for the requesting hospital's patients.
    const result = await Hospital.updateOne(
      { _id: hospitalId, 'beds.available': { $gte: qty } },
      { $inc: { 'beds.available': -qty, 'beds.occupied': qty } }
    );
    return result.modifiedCount === 1;
  }

  const path = availablePath(resourceType, details);
  const update = { $inc: { [path]: -qty } };
  if (resourceType === 'blood') {
    update.$set = { [path.replace(/availableUnits$/, 'lastUpdated')]: new Date() };
  }
  const result = await Hospital.updateOne({ _id: hospitalId, [path]: { $gte: qty } }, update);
  return result.modifiedCount === 1;
};

/**
 * Atomically add `qty` units to a hospital's stock (transfer received, or stock
 * returned to the provider after a cancellation). Keeps available <= total.
 */
const addStock = async (hospitalId, resourceType, details, qty) => {
  if (!isTracked(resourceType)) return;

  if (resourceType === 'beds') {
    // Patients moved out: free `qty` beds, keeping available = total - occupied.
    await Hospital.updateOne({ _id: hospitalId }, [
      { $set: { 'beds.occupied': { $max: [0, { $subtract: ['$beds.occupied', qty] }] } } },
      { $set: { 'beds.available': { $max: [0, { $subtract: ['$beds.total', '$beds.occupied'] }] } } },
    ]);
    return;
  }

  if (resourceType === 'blood') {
    const path = availablePath(resourceType, details);
    await Hospital.updateOne(
      { _id: hospitalId },
      { $inc: { [path]: qty }, $set: { [path.replace(/availableUnits$/, 'lastUpdated')]: new Date() } }
    );
    return;
  }

  const { available, total } = TRACKED_RESOURCES[resourceType];
  await Hospital.updateOne({ _id: hospitalId }, [
    { $set: { [available]: { $add: [{ $ifNull: [`$${available}`, 0] }, qty] } } },
    { $set: { [total]: { $max: [{ $ifNull: [`$${total}`, 0] }, `$${available}`] } } },
  ]);
};

const broadcastHospitalResources = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId).select('name beds bloodInventory organs');
  if (!hospital) return;
  emitAll('resource_update', {
    hospitalId: hospital._id,
    name: hospital.name,
    beds: hospital.beds,
    bloodInventory: hospital.bloodInventory,
    organs: hospital.organs,
  });
};

const loadRequest = (id) =>
  ResourceRequest.findById(id)
    .populate('requestingHospital', 'name user')
    .populate('providingHospital', 'name user');

const notifyParties = (request, event) => {
  emitTo([request.requestingHospital && request.requestingHospital.user, request.requestingHospital && request.requestingHospital._id], event, request);
  emitTo([request.providingHospital && request.providingHospital.user, request.providingHospital && request.providingHospital._id], event, request);
};

// @desc    Submit a resource request from Hospital A to Hospital B
// @route   POST /api/resource-requests
// @access  Private (Hospital admin only)
const createResourceRequest = async (req, res) => {
  try {
    const { providingHospitalId, resourceType, details, priority, reason } = req.body;

    if (!isValidObjectId(providingHospitalId)) {
      return res.status(400).json({ message: 'A valid providingHospitalId is required.' });
    }
    if (!RESOURCE_TYPES.includes(resourceType)) {
      return res.status(400).json({ message: `resourceType must be one of: ${RESOURCE_TYPES.join(', ')}` });
    }
    const quantity = toPositiveInt(req.body.quantity);
    if (!quantity || quantity > MAX_QUANTITY) {
      return res.status(400).json({ message: `quantity must be a whole number between 1 and ${MAX_QUANTITY}.` });
    }
    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: `priority must be one of: ${PRIORITIES.join(', ')}` });
    }

    // Only whitelisted detail fields are stored; blood groups are normalised to
    // the inventory key format ("O+" / "o+" / "Op" -> "Op").
    const cleanDetails = {};
    if (details && typeof details === 'object') {
      if (typeof details.medicineName === 'string' && details.medicineName.trim()) cleanDetails.medicineName = details.medicineName.trim();
      if (typeof details.notes === 'string' && details.notes.trim()) cleanDetails.notes = details.notes.trim();
    }
    if (resourceType === 'blood') {
      const key = bloodGroupToKey(details && details.bloodGroup);
      if (!key) {
        return res.status(400).json({ message: 'A valid details.bloodGroup (e.g. "O+" or "Op") is required for blood requests.' });
      }
      cleanDetails.bloodGroup = key;
    }
    if (resourceType === 'medicines' && !cleanDetails.medicineName) {
      return res.status(400).json({ message: 'details.medicineName is required for medicine requests.' });
    }

    const requestingHospital = await Hospital.findOne({ user: req.user._id });
    if (!requestingHospital) {
      return res.status(404).json({ message: 'Requesting hospital profile not found' });
    }
    if (requestingHospital.verifiedStatus !== 'verified') {
      return res.status(403).json({ message: 'Your hospital must be verified by an administrator before using the resource network.' });
    }
    if (requestingHospital._id.equals(providingHospitalId)) {
      return res.status(400).json({ message: 'A hospital cannot request resources from itself.' });
    }

    const providingHospital = await Hospital.findById(providingHospitalId);
    if (!providingHospital || providingHospital.verifiedStatus !== 'verified') {
      return res.status(404).json({ message: 'Providing hospital not found' });
    }

    const resourceRequest = await ResourceRequest.create({
      requestingHospital: requestingHospital._id,
      providingHospital: providingHospital._id,
      resourceType,
      details: cleanDetails,
      quantity,
      priority: priority || undefined,
      reason: typeof reason === 'string' ? reason.trim() : undefined,
      status: 'pending',
    });

    const label = describeResource(resourceRequest);
    const urgent = ['critical', 'high'].includes(resourceRequest.priority);
    await notify(
      providingHospital.user,
      `${urgent ? 'URGENT' : 'New'} resource request (${resourceRequest.priority} priority) from ${requestingHospital.name}: ${quantity} unit(s) of ${label}.`,
      urgent ? 'critical' : 'warning'
    );
    emitTo([providingHospital.user, providingHospital._id], 'resource_request_received', resourceRequest);

    res.status(201).json(resourceRequest);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get resource requests (Inbound & Outbound)
// @route   GET /api/resource-requests
// @access  Private (Hospital admin only)
const getResourceRequests = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const { skip, limit } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
    const [inbound, outbound] = await Promise.all([
      ResourceRequest.find({ providingHospital: hospital._id })
        .populate('requestingHospital', 'name contactPhone emergencyPhone address')
        .populate('providingHospital', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ResourceRequest.find({ requestingHospital: hospital._id })
        .populate('requestingHospital', 'name')
        .populate('providingHospital', 'name contactPhone emergencyPhone address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({ inbound, outbound });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Respond to resource request (Accept, Reject, Partial Fulfill)
// @route   PUT /api/resource-requests/:id/respond
// @access  Private (Hospital admin only)
const respondToRequest = async (req, res) => {
  try {
    const { action, expectedTransferTime } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }
    if (!['accept', 'reject', 'partial'].includes(action)) {
      return res.status(400).json({ message: 'action must be one of: accept, reject, partial' });
    }

    let transferTime;
    if (expectedTransferTime !== undefined && expectedTransferTime !== null && expectedTransferTime !== '') {
      transferTime = new Date(expectedTransferTime);
      if (Number.isNaN(transferTime.getTime())) {
        return res.status(400).json({ message: 'expectedTransferTime must be a valid date' });
      }
    }

    const request = await loadRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital || !request.providingHospital || !request.providingHospital._id.equals(hospital._id)) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `This request has already been processed (status: ${request.status}).` });
    }

    let newStatus;
    let units = 0;
    if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'accept') {
      newStatus = 'accepted';
      units = request.quantity;
    } else {
      newStatus = 'partially_fulfilled';
      units = toPositiveInt(req.body.fulfilledQuantity);
      if (!units || units >= request.quantity) {
        return res.status(400).json({
          message: `fulfilledQuantity must be a whole number between 1 and ${request.quantity - 1}. Use "accept" to fulfil the full quantity.`,
        });
      }
    }

    if (units > 0 && isTracked(request.resourceType)) {
      const available = getAvailableUnits(hospital, request.resourceType, request.details);
      if (available !== null && available < units) {
        return res.status(400).json({
          message: `Insufficient stock: only ${available} unit(s) of ${describeResource(request)} available.` +
            (available > 0 ? ' You can partially fulfil this request instead.' : ''),
        });
      }
    }

    // Claim the request atomically so it can only ever be processed once.
    const update = { status: newStatus, fulfilledQuantity: units };
    if (transferTime) update.expectedTransferTime = transferTime;
    const claimed = await ResourceRequest.findOneAndUpdate({ _id: request._id, status: 'pending' }, update, { new: true });
    if (!claimed) {
      return res.status(409).json({ message: 'This request was processed by someone else. Please refresh.' });
    }

    if (units > 0) {
      const deducted = await deductStock(hospital._id, request.resourceType, request.details, units);
      if (!deducted) {
        // Stock changed between the check and the update: undo the claim.
        await ResourceRequest.updateOne({ _id: request._id }, { status: 'pending', fulfilledQuantity: 0 });
        return res.status(409).json({ message: 'Stock changed while processing. Please review your inventory and try again.' });
      }
    }

    const updated = await loadRequest(request._id);
    const label = describeResource(updated);
    const outcome =
      newStatus === 'rejected'
        ? 'rejected'
        : newStatus === 'accepted'
          ? `accepted (${units} unit(s) of ${label})`
          : `partially fulfilled (${units} of ${updated.quantity} unit(s) of ${label})`;

    if (updated.requestingHospital) {
      await notify(
        updated.requestingHospital.user,
        `Your resource request to ${hospital.name} has been ${outcome}.`,
        newStatus === 'rejected' ? 'warning' : 'info'
      );
    }
    notifyParties(updated, 'resource_request_updated');
    if (units > 0) await broadcastHospitalResources(hospital._id);

    res.json({ message: 'Response submitted successfully', request: updated });
  } catch (error) {
    sendError(res, error);
  }
};

// Allowed status changes through PUT /:id/status (accept/reject go through /respond).
const STATUS_TRANSITIONS = {
  in_transit: { from: ['accepted', 'partially_fulfilled'], by: ['provider'] },
  completed: { from: ['accepted', 'partially_fulfilled', 'in_transit'], by: ['provider', 'requester'] },
  cancelled: { from: ['pending', 'accepted', 'partially_fulfilled', 'in_transit'], by: ['provider', 'requester'] },
};

// @desc    Update transfer status (In Transit, Completed, Cancelled)
// @route   PUT /api/resource-requests/:id/status
// @access  Private (Hospital admin only)
const updateTransferStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }
    const rule = STATUS_TRANSITIONS[status];
    if (!rule) {
      return res.status(400).json({ message: `status must be one of: ${Object.keys(STATUS_TRANSITIONS).join(', ')}` });
    }

    const request = await loadRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    const isRequester = !!(hospital && request.requestingHospital && request.requestingHospital._id.equals(hospital._id));
    const isProvider = !!(hospital && request.providingHospital && request.providingHospital._id.equals(hospital._id));
    if (!isRequester && !isProvider) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const role = isProvider ? 'provider' : 'requester';
    const allowedForRole = rule.by.includes(role);
    // A pending request is cancelled by its requester; the provider rejects it instead.
    const providerCancellingPending = status === 'cancelled' && request.status === 'pending' && !isRequester;
    if (!allowedForRole || providerCancellingPending) {
      return res.status(403).json({
        message: providerCancellingPending
          ? 'Use "reject" to decline a pending request.'
          : `Only the ${rule.by.join(' or ')} hospital can mark this request as ${status}.`,
      });
    }
    if (!rule.from.includes(request.status)) {
      return res.status(400).json({ message: `Cannot change status from ${request.status} to ${status}.` });
    }

    // Atomic transition: completing twice can never add the resources twice.
    const claimed = await ResourceRequest.findOneAndUpdate(
      { _id: request._id, status: request.status },
      { status },
      { new: true }
    );
    if (!claimed) {
      return res.status(409).json({ message: 'This request was updated by someone else. Please refresh.' });
    }

    // fulfilledQuantity is the number of units actually reserved from the provider.
    // Requests accepted before this field was always set fall back to the full quantity.
    const units =
      request.fulfilledQuantity > 0
        ? request.fulfilledQuantity
        : ['accepted', 'in_transit'].includes(request.status)
          ? request.quantity
          : 0;
    const label = describeResource(request);
    const touchedHospitals = [];

    if (status === 'completed' && units > 0) {
      await addStock(request.requestingHospital._id, request.resourceType, request.details, units);
      touchedHospitals.push(request.requestingHospital._id);
    }
    if (status === 'cancelled' && STOCK_RESERVED_STATUSES.includes(request.status) && units > 0) {
      // Give the reserved units back to the providing hospital.
      await addStock(request.providingHospital._id, request.resourceType, request.details, units);
      touchedHospitals.push(request.providingHospital._id);
    }

    const updated = await loadRequest(request._id);
    const providerName = updated.providingHospital ? updated.providingHospital.name : 'the providing hospital';
    const requesterName = updated.requestingHospital ? updated.requestingHospital.name : 'the requesting hospital';

    if (status === 'completed') {
      if (updated.requestingHospital) {
        await notify(updated.requestingHospital.user, `Resource transfer completed: received ${units} unit(s) of ${label} from ${providerName}.`, 'info');
      }
      if (updated.providingHospital) {
        await notify(updated.providingHospital.user, `Resource transfer of ${units} unit(s) of ${label} to ${requesterName} is completed.`, 'info');
      }
    } else if (status === 'in_transit') {
      if (updated.requestingHospital) {
        await notify(updated.requestingHospital.user, `${providerName} has dispatched ${units} unit(s) of ${label}. Transfer is in transit.`, 'info');
      }
    } else if (status === 'cancelled') {
      const other = isProvider ? updated.requestingHospital : updated.providingHospital;
      if (other) {
        await notify(other.user, `Resource request for ${label} between ${requesterName} and ${providerName} was cancelled.`, 'warning');
      }
    }

    notifyParties(updated, 'resource_request_updated');
    for (const id of touchedHospitals) {
      await broadcastHospitalResources(id);
    }

    res.json({ message: `Status updated to ${status}`, request: updated });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  createResourceRequest,
  getResourceRequests,
  respondToRequest,
  updateTransferStatus,
};
