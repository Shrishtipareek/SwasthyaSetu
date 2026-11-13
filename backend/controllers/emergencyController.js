const EmergencyRequest = require('../models/EmergencyRequest');
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const Doctor = require('../models/Doctor');
const { notify, emitTo, emitAll } = require('../utils/notify');
const { calculateDistance } = require('../utils/geo');
const { fallbackHospitals } = require('../utils/fallbackData');
const {
  sendError,
  isDbConnected,
  isValidObjectId,
  isValidLocation,
  normalizeLocation,
  bloodGroupToKey,
  BLOOD_KEYS,
} = require('../utils/http');

const REQUEST_TYPES = EmergencyRequest.schema.path('requestType').enumValues;
const STATUSES = EmergencyRequest.schema.path('status').enumValues;
const NO_CONTACT = 'Not provided';

// Forward-only lifecycle for an emergency request.
const STATUS_TRANSITIONS = {
  requested: ['accepted', 'ambulance_assigned', 'completed'],
  accepted: ['ambulance_assigned', 'completed'],
  ambulance_assigned: ['completed'],
  completed: [],
};

// National helplines returned whenever a request could not be logged.
const EMERGENCY_HELPLINES = ['108 (National Ambulance)', '102 (Medical Intake)', '112 (Universal Emergency)'];

const estimateTravelTime = (distanceKm) => `${Math.max(1, Math.round(distanceKm * 2.5))} mins`;

const withDistances = (hospitals, location) =>
  hospitals
    .filter((h) => h.location && Number.isFinite(h.location.lat) && Number.isFinite(h.location.lng))
    .map((h) => {
      const distance = calculateDistance(location.lat, location.lng, h.location.lat, h.location.lng);
      return { hospital: h, distance, travelTime: estimateTravelTime(distance) };
    });

const toRecommendation = (m) => ({
  _id: m.hospital._id,
  name: m.hospital.name,
  address: m.hospital.address,
  emergencyPhone: m.hospital.emergencyPhone,
  location: m.hospital.location,
  distance: m.distance,
  travelTime: m.travelTime,
  icuAvailable: m.hospital.beds ? m.hospital.beds.icuAvailable || 0 : m.hospital.icuAvailable || 0,
  emergencyAvailable: m.hospital.beds ? m.hospital.beds.emergencyAvailable || 0 : m.hospital.emergencyAvailable || 0,
  resourceAvailable: m.available,
});

// Real Delhi hospitals with their public emergency numbers. Only served when the
// database cannot be reached, so a patient in an emergency still gets numbers to call.
const fallbackResponse = (res, location, message) => {
  const matches = withDistances(fallbackHospitals, location)
    .map((m) => ({ ...m, available: true }))
    .sort((a, b) => a.distance - b.distance);
  return res.status(200).json({
    emergencyRequest: null,
    isFallback: true,
    message,
    emergencyHelplines: EMERGENCY_HELPLINES,
    recommendedHospitals: matches.map((m) => ({ ...toRecommendation(m), isFallback: true })),
  });
};

// Count available ambulances / doctors per hospital in one query each.
const countByHospital = async (Model, hospitalIds, status) => {
  const rows = await Model.aggregate([
    { $match: { hospital: { $in: hospitalIds }, status } },
    { $group: { _id: '$hospital', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
};

// @desc    Initiate an emergency request (finds matching hospitals & logs request)
// @route   POST /api/emergency
// @access  Public (guests and patients)
const initiateEmergency = async (req, res) => {
  try {
    const { requestType, location, details } = req.body;
    const patientId = req.user ? req.user._id : null;
    // Logged-in patients are reached on their profile number. A guest in an
    // emergency must never be blocked for skipping the phone field, but no number
    // is ever invented either (the UI used to send a hard-coded demo number).
    const providedContact = String(req.body.contactNumber || (req.user && req.user.phone) || '').trim();
    const contactNumber = providedContact || NO_CONTACT;

    if (!REQUEST_TYPES.includes(requestType)) {
      return res.status(400).json({ message: `requestType must be one of: ${REQUEST_TYPES.join(', ')}` });
    }
    // lat/lng of 0 are valid coordinates; the old `!location.lat` check rejected them.
    if (!isValidLocation(location)) {
      return res.status(400).json({ message: 'Valid location coordinates (lat, lng) are required.' });
    }
    if (providedContact.length > 20 || (providedContact && !/^[+\d][\d\s()-]{2,19}$/.test(providedContact))) {
      return res.status(400).json({ message: 'contactNumber must be a valid phone number.' });
    }
    const loc = normalizeLocation(location);
    const bloodKey = requestType === 'blood' && req.body.bloodGroup ? bloodGroupToKey(req.body.bloodGroup) : null;

    if (!isDbConnected()) {
      return fallbackResponse(
        res,
        loc,
        'The live hospital network is temporarily unreachable, so your request could not be logged. Please call one of these hospitals directly or dial 102/108.'
      );
    }

    const hospitals = await Hospital.find({ verifiedStatus: 'verified' }).lean();
    if (hospitals.length === 0) {
      return res.status(404).json({
        message: 'No verified hospitals are connected to the network yet. Please dial 102/108 for emergency services.',
        emergencyHelplines: EMERGENCY_HELPLINES,
      });
    }

    const hospitalIds = hospitals.map((h) => h._id);
    const ambulanceCounts = requestType === 'ambulance' ? await countByHospital(Ambulance, hospitalIds, 'available') : null;
    const doctorCounts = requestType === 'doctor' ? await countByHospital(Doctor, hospitalIds, 'available') : null;

    const matches = withDistances(hospitals, loc).map((m) => {
      const h = m.hospital;
      let available;
      switch (requestType) {
        case 'bed':
          available = (h.beds && h.beds.emergencyAvailable) > 0;
          break;
        case 'icu':
          available = (h.beds && h.beds.icuAvailable) > 0;
          break;
        case 'ambulance':
          available = (ambulanceCounts.get(h._id.toString()) || 0) > 0;
          break;
        case 'blood': {
          const inventory = h.bloodInventory || {};
          available = bloodKey
            ? ((inventory[bloodKey] && inventory[bloodKey].availableUnits) || 0) > 0
            : BLOOD_KEYS.some((k) => ((inventory[k] && inventory[k].availableUnits) || 0) > 0);
          break;
        }
        case 'oxygen':
          available = (h.facilities || []).some((f) => /oxygen/i.test(f)) || (h.beds && h.beds.ventilatorsAvailable) > 0;
          break;
        case 'doctor':
          available = (doctorCounts.get(h._id.toString()) || 0) > 0;
          break;
        default:
          available = true;
      }
      return { ...m, available };
    });

    if (matches.length === 0) {
      return res.status(404).json({
        message: 'No hospitals with a known location are available. Please dial 102/108.',
        emergencyHelplines: EMERGENCY_HELPLINES,
      });
    }

    // Hospitals that actually have the resource first, then nearest first.
    matches.sort((a, b) => (a.available !== b.available ? (a.available ? -1 : 1) : a.distance - b.distance));
    const bestMatches = matches.slice(0, 5);
    const target = bestMatches[0];
    const recommendedHospitals = bestMatches.map(toRecommendation);

    let emergencyRequest;
    try {
      emergencyRequest = await EmergencyRequest.create({
        patient: patientId,
        hospital: target.hospital._id,
        requestType,
        location: loc,
        contactNumber,
        status: 'requested',
        distance: Number(target.distance.toFixed(2)),
        travelTime: target.travelTime,
        details: typeof details === 'string' && details.trim() ? details.trim() : 'Emergency intake requested',
      });
    } catch (createErr) {
      // Never leave a patient without options: return the hospitals even if logging failed.
      console.error('Failed to log emergency request:', createErr.message);
      return res.status(200).json({
        emergencyRequest: null,
        message: 'Your request could not be logged. Please call one of these hospitals directly or dial 102/108.',
        emergencyHelplines: EMERGENCY_HELPLINES,
        recommendedHospitals,
      });
    }

    await notify(
      target.hospital.user,
      `CRITICAL: New emergency intake request (${requestType}) from ${
        contactNumber === NO_CONTACT ? 'a guest (no phone number provided)' : contactNumber
      }. Distance: ${target.distance.toFixed(1)} km.`,
      'critical'
    );
    emitTo([target.hospital.user, target.hospital._id], 'emergency_alert_received', emergencyRequest);
    // Public broadcast with coarse (~1 km) coordinates only: the exact location of
    // a patient must not be pushed to every connected client.
    emitAll('emergency_public_alert', {
      type: requestType,
      location: { lat: Number(loc.lat.toFixed(2)), lng: Number(loc.lng.toFixed(2)) },
    });

    res.status(201).json({ emergencyRequest, recommendedHospitals });
  } catch (error) {
    // Unexpected failure: still give the caller something actionable.
    console.error('Critical emergency dispatch error:', error);
    if (res.headersSent) return;
    res.status(500).json({
      message: 'Failed to process automated emergency dispatch. Please call emergency services or hospitals directly.',
      emergencyHelplines: EMERGENCY_HELPLINES,
      recommendedHospitals: fallbackHospitals.map((h) => ({
        _id: h._id,
        name: h.name,
        address: h.address,
        emergencyPhone: h.emergencyPhone,
        location: h.location,
        isFallback: true,
      })),
    });
  }
};

// @desc    Update emergency request status
// @route   PUT /api/emergency/:id
// @access  Private (Hospital admin only)
const updateEmergencyStatus = async (req, res) => {
  try {
    const { status, ambulanceId } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid emergency request id' });
    }
    if (!STATUSES.includes(status) || status === 'requested') {
      return res.status(400).json({ message: 'status must be one of: accepted, ambulance_assigned, completed' });
    }
    if (ambulanceId !== undefined && ambulanceId !== null && ambulanceId !== '' && !isValidObjectId(ambulanceId)) {
      return res.status(400).json({ message: 'Invalid ambulance id' });
    }

    const request = await EmergencyRequest.findById(req.params.id).populate('hospital', 'name user');
    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital || !request.hospital || !request.hospital._id.equals(hospital._id)) {
      return res.status(403).json({ message: 'Not authorized to manage this emergency request' });
    }

    if (!STATUS_TRANSITIONS[request.status].includes(status)) {
      return res.status(400).json({ message: `Cannot change status from ${request.status} to ${status}.` });
    }

    let assignedAmbulance = null;
    if (status === 'ambulance_assigned') {
      // Claim an ambulance atomically. It must belong to THIS hospital: previously any
      // hospital could mark another hospital's ambulance as busy.
      const filter = { hospital: hospital._id, status: 'available' };
      if (ambulanceId) filter._id = ambulanceId;
      assignedAmbulance = await Ambulance.findOneAndUpdate(filter, { status: 'busy' }, { new: true });
      if (!assignedAmbulance) {
        return res.status(400).json({
          message: ambulanceId
            ? 'That ambulance is not available or does not belong to your hospital.'
            : 'No ambulances are currently available at your hospital.',
        });
      }
      request.ambulance = assignedAmbulance._id;
      request.details =
        `${request.details || ''} | Ambulance ${assignedAmbulance.licensePlate} assigned. ` +
        `Driver: ${assignedAmbulance.driverName} (${assignedAmbulance.driverContact})`;
    }

    const previousStatus = request.status;
    request.status = status;
    try {
      // Saving with the previous status as a guard prevents two concurrent updates
      // from both succeeding.
      const result = await EmergencyRequest.updateOne(
        { _id: request._id, status: previousStatus },
        { status: request.status, ambulance: request.ambulance, details: request.details }
      );
      if (result.modifiedCount !== 1) {
        if (assignedAmbulance) await Ambulance.updateOne({ _id: assignedAmbulance._id }, { status: 'available' });
        return res.status(409).json({ message: 'This emergency request was updated by someone else. Please refresh.' });
      }
    } catch (saveErr) {
      if (assignedAmbulance) await Ambulance.updateOne({ _id: assignedAmbulance._id }, { status: 'available' });
      throw saveErr;
    }

    // Free the ambulance once the emergency is over.
    if (status === 'completed' && request.ambulance) {
      await Ambulance.updateOne({ _id: request.ambulance, status: 'busy' }, { status: 'available' });
    }

    const updated = await EmergencyRequest.findById(request._id)
      .populate('hospital', 'name user')
      .populate('ambulance', 'licensePlate driverName driverContact status location');

    if (updated.patient) {
      await notify(
        updated.patient,
        `Your emergency request status was updated to ${status.replace('_', ' ').toUpperCase()} by ${hospital.name}.`,
        'info'
      );
    }
    emitTo([hospital.user, hospital._id], 'emergency_request_updated', updated);
    if (updated.patient) emitTo(updated.patient, 'emergency_request_updated', updated);
    if (updated.ambulance && (assignedAmbulance || status === 'completed')) {
      // Same payload shape as PUT /api/ambulances/:id (the full ambulance document).
      const ambulance = await Ambulance.findById(updated.ambulance._id);
      if (ambulance) emitAll('ambulance_update', ambulance);
    }

    res.json({ message: `Status updated to ${status}`, request: updated });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get emergency requests for hospital (optionally filtered by ?status=)
// @route   GET /api/emergency/hospital
// @access  Private (Hospital admin only)
const getHospitalEmergencies = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const query = { hospital: hospital._id };
    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
      }
      query.status = req.query.status;
    }

    const requests = await EmergencyRequest.find(query)
      .populate('patient', 'name phone medicalInfo')
      .populate('ambulance', 'licensePlate driverName driverContact status')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  initiateEmergency,
  updateEmergencyStatus,
  getHospitalEmergencies,
};
