const ResourceRequest = require('../models/ResourceRequest');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');

// @desc    Submit a resource request from Hospital A to Hospital B
// @route   POST /api/resource-requests
// @access  Private (Hospital admin only)
const createResourceRequest = async (req, res) => {
  try {
    const { providingHospitalId, resourceType, details, quantity, priority, reason } = req.body;

    const requestingHospital = await Hospital.findOne({ user: req.user._id });
    if (!requestingHospital) {
      return res.status(404).json({ message: 'Requesting hospital profile not found' });
    }

    const providingHospital = await Hospital.findById(providingHospitalId);
    if (!providingHospital) {
      return res.status(404).json({ message: 'Providing hospital not found' });
    }

    const resourceRequest = await ResourceRequest.create({
      requestingHospital: requestingHospital._id,
      providingHospital: providingHospitalId,
      resourceType,
      details,
      quantity,
      priority,
      reason,
      status: 'pending'
    });

    // Notify providing hospital
    await Notification.create({
      recipient: providingHospital.user,
      message: `New URGENT resource request from ${requestingHospital.name}: ${quantity} units of ${resourceType}.`,
      type: priority === 'critical' || priority === 'high' ? 'critical' : 'warning'
    });

    // Send real-time notification
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(providingHospital.user.toString()).emit('resource_request_received', resourceRequest);
    }

    res.status(201).json(resourceRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const inbound = await ResourceRequest.find({ providingHospital: hospital._id })
      .populate('requestingHospital', 'name contactPhone emergencyPhone address')
      .populate('providingHospital', 'name')
      .sort({ createdAt: -1 });

    const outbound = await ResourceRequest.find({ requestingHospital: hospital._id })
      .populate('requestingHospital', 'name')
      .populate('providingHospital', 'name contactPhone emergencyPhone address')
      .sort({ createdAt: -1 });

    res.json({ inbound, outbound });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to resource request (Accept, Reject, Partial Fulfill)
// @route   PUT /api/resource-requests/:id/respond
// @access  Private (Hospital admin only)
const respondToRequest = async (req, res) => {
  try {
    const { action, fulfilledQuantity, expectedTransferTime } = req.body;
    const request = await ResourceRequest.findById(req.params.id)
      .populate('requestingHospital', 'name user')
      .populate('providingHospital', 'name user');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital || request.providingHospital._id.toString() !== hospital._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to respond to this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed.' });
    }

    let finalFulfilled = request.quantity;

    if (action === 'accept') {
      request.status = 'accepted';
      // Deduct resource from providing hospital
      await deductResources(hospital, request.resourceType, request.quantity, request.details);
    } else if (action === 'reject') {
      request.status = 'rejected';
    } else if (action === 'partial') {
      request.status = 'partially_fulfilled';
      finalFulfilled = Number(fulfilledQuantity) || 0;
      request.fulfilledQuantity = finalFulfilled;
      // Deduct partial amount
      await deductResources(hospital, request.resourceType, finalFulfilled, request.details);
    } else {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    if (expectedTransferTime) {
      request.expectedTransferTime = expectedTransferTime;
    }
    
    await request.save();

    // Notify requesting hospital
    await Notification.create({
      recipient: request.requestingHospital.user,
      message: `Resource request to ${hospital.name} has been ${request.status.replace('_', ' ')}.`,
      type: action === 'reject' ? 'warning' : 'info'
    });

    // Real-time update
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(request.requestingHospital.user.toString()).emit('resource_request_updated', request);
      // Global resource update broadcast
      io.emit('resource_update', {
        hospitalId: hospital._id,
        name: hospital.name,
        beds: hospital.beds,
        bloodInventory: hospital.bloodInventory
      });
    }

    res.json({ message: 'Response submitted successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update transfer status (e.g. In Transit, Completed)
// @route   PUT /api/resource-requests/:id/status
// @access  Private (Hospital admin only)
const updateTransferStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await ResourceRequest.findById(req.params.id)
      .populate('requestingHospital', 'name user')
      .populate('providingHospital', 'name user');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify requesting or providing hospital
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital || (request.requestingHospital._id.toString() !== hospital._id.toString() && request.providingHospital._id.toString() !== hospital._id.toString())) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    // If completed, add resources to requesting hospital
    if (status === 'completed') {
      const targetHospital = await Hospital.findById(request.requestingHospital._id);
      const amountToAdd = request.status === 'partially_fulfilled' || request.fulfilledQuantity > 0 ? request.fulfilledQuantity : request.quantity;
      await addResources(targetHospital, request.resourceType, amountToAdd, request.details);
      
      // Notify both parties
      await Notification.create({
        recipient: request.requestingHospital.user,
        message: `Resource transfer completed: Received ${amountToAdd} units of ${request.resourceType} from ${request.providingHospital.name}.`,
        type: 'info'
      });
    }

    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(request.requestingHospital.user.toString()).emit('resource_request_updated', request);
      io.to(request.providingHospital.user.toString()).emit('resource_request_updated', request);
      
      if (status === 'completed') {
        const targetHospital = await Hospital.findById(request.requestingHospital._id);
        io.emit('resource_update', {
          hospitalId: targetHospital._id,
          name: targetHospital.name,
          beds: targetHospital.beds,
          bloodInventory: targetHospital.bloodInventory
        });
      }
    }

    res.json({ message: `Status updated to ${status}`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to deduct resources
const deductResources = async (hospital, resourceType, quantity, details) => {
  if (resourceType === 'beds') {
    hospital.beds.available = Math.max(0, hospital.beds.available - quantity);
    hospital.beds.occupied += quantity;
  } else if (resourceType === 'icuBeds') {
    hospital.beds.icuAvailable = Math.max(0, hospital.beds.icuAvailable - quantity);
  } else if (resourceType === 'emergencyBeds') {
    hospital.beds.emergencyAvailable = Math.max(0, hospital.beds.emergencyAvailable - quantity);
  } else if (resourceType === 'ventilators') {
    hospital.beds.ventilatorsAvailable = Math.max(0, hospital.beds.ventilatorsAvailable - quantity);
  } else if (resourceType === 'blood' && details.bloodGroup) {
    const group = details.bloodGroup;
    if (hospital.bloodInventory[group]) {
      hospital.bloodInventory[group].availableUnits = Math.max(0, hospital.bloodInventory[group].availableUnits - quantity);
      hospital.bloodInventory[group].lastUpdated = Date.now();
    }
  }
  await hospital.save();
};

// Helper function to add resources
const addResources = async (hospital, resourceType, quantity, details) => {
  if (resourceType === 'beds') {
    hospital.beds.available += quantity;
    hospital.beds.occupied = Math.max(0, hospital.beds.occupied - quantity);
  } else if (resourceType === 'icuBeds') {
    hospital.beds.icuAvailable += quantity;
  } else if (resourceType === 'emergencyBeds') {
    hospital.beds.emergencyAvailable += quantity;
  } else if (resourceType === 'ventilators') {
    hospital.beds.ventilatorsAvailable += quantity;
  } else if (resourceType === 'blood' && details.bloodGroup) {
    const group = details.bloodGroup;
    if (hospital.bloodInventory[group]) {
      hospital.bloodInventory[group].availableUnits += quantity;
      hospital.bloodInventory[group].lastUpdated = Date.now();
    }
  }
  await hospital.save();
};

module.exports = {
  createResourceRequest,
  getResourceRequests,
  respondToRequest,
  updateTransferStatus
};
