const EmergencyRequest = require('../models/EmergencyRequest');
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const Notification = require('../models/Notification');
const { calculateDistance } = require('../utils/geo');
const { fallbackHospitals } = require('../utils/fallbackData');

const initiateEmergency = async (req, res) => {
  try {
    const { requestType, location, contactNumber, details } = req.body;
    const patientId = req.user ? req.user._id : null;

    if (!location || location.lat === undefined || location.lng === undefined) {
      return res.status(400).json({ message: 'User location coordinates are required.' });
    }

    const lat = parseFloat(location.lat);
    const lng = parseFloat(location.lng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.' });
    }

    let hospitals = [];
    try {
      hospitals = await Hospital.find({ verifiedStatus: 'verified' });
    } catch (dbErr) {
      console.warn('DB query error during emergency lookup, using fallback hospitals:', dbErr.message);
      return res.status(200).json({
        emergencyRequest: {
          _id: "emg_" + Date.now(),
          requestType,
          location,
          contactNumber,
          status: 'requested',
          distance: 1.2,
          travelTime: "3 mins",
          details: details || 'Emergency intake requested (Standby Mode)',
          isFallback: true
        },
        recommendedHospitals: fallbackHospitals.map(h => ({
          _id: h._id,
          name: h.name,
          address: h.address,
          emergencyPhone: h.emergencyPhone,
          location: h.location,
          distance: 1.5,
          travelTime: "4 mins",
          icuAvailable: h.beds?.icuAvailable || 0,
          emergencyAvailable: h.beds?.emergencyAvailable || 0,
          isFallback: true
        }))
      });
    }
    
    const matches = hospitals.map(h => {
      const distance = calculateDistance(location.lat, location.lng, h.location.lat, h.location.lng);
      
      let available = false;
      let qty = 0;
      
      switch(requestType) {
        case 'bed':
          available = h.beds?.emergencyAvailable > 0;
          qty = h.beds?.emergencyAvailable || 0;
          break;
        case 'icu':
          available = h.beds?.icuAvailable > 0;
          qty = h.beds?.icuAvailable || 0;
          break;
        case 'ambulance':
          available = true;
          qty = 1;
          break;
        case 'blood':
          available = h.bloodInventory ? Object.values(h.bloodInventory).some(g => g.availableUnits > 0) : true;
          qty = 1;
          break;
        case 'oxygen':
          available = h.facilities ? (h.facilities.includes('Oxygen Plant') || h.facilities.includes('Oxygen Cylinder')) : true;
          qty = 1;
          break;
        case 'doctor':
          available = true;
          qty = 1;
          break;
        default:
          available = true;
          qty = 1;
      }

      const travelTimeMin = Math.round(distance * 2.5) || 1;
      const travelTime = `${travelTimeMin} mins`;

      return {
        hospital: h,
        distance,
        travelTime,
        available,
        quantity: qty
      };
    });

    matches.sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      return a.distance - b.distance;
    });

    const bestMatches = matches.slice(0, 5);

    if (bestMatches.length === 0) {
      return res.status(200).json({
        emergencyRequest: {
          _id: "emg_" + Date.now(),
          requestType,
          location,
          contactNumber,
          status: 'requested',
          distance: 1.2,
          travelTime: "3 mins",
          details: details || 'Emergency intake requested (Standby Mode)',
          isFallback: true
        },
        recommendedHospitals: fallbackHospitals.map(h => ({
          _id: h._id,
          name: h.name,
          address: h.address,
          emergencyPhone: h.emergencyPhone,
          location: h.location,
          distance: 1.5,
          travelTime: "4 mins",
          icuAvailable: h.beds?.icuAvailable || 0,
          emergencyAvailable: h.beds?.emergencyAvailable || 0,
          isFallback: true
        }))
      });
    }

    const targetMatch = bestMatches[0];
    let emergencyRequest;
    try {
      emergencyRequest = await EmergencyRequest.create({
        patient: patientId,
        hospital: targetMatch.hospital._id,
        requestType,
        location,
        contactNumber,
        status: 'requested',
        distance: targetMatch.distance,
        travelTime: targetMatch.travelTime,
        details: details || 'Emergency intake requested'
      });

      if (targetMatch.hospital.user) {
        await Notification.create({
          recipient: targetMatch.hospital.user,
          message: `CRITICAL: New Emergency Intake Request (${requestType}) from ${contactNumber}. Distance: ${targetMatch.distance.toFixed(1)} km.`,
          type: 'critical'
        });
      }
    } catch (createErr) {
      emergencyRequest = {
        _id: "emg_" + Date.now(),
        requestType,
        location,
        contactNumber,
        status: 'requested',
        distance: targetMatch.distance,
        travelTime: targetMatch.travelTime,
        details: details || 'Emergency intake requested'
      };
    }

    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      if (targetMatch.hospital.user) {
        io.to(targetMatch.hospital.user.toString()).emit('emergency_alert_received', emergencyRequest);
      }
      io.emit('emergency_public_alert', {
        type: requestType,
        location: location
      });
    }

    res.status(201).json({
      emergencyRequest,
      recommendedHospitals: bestMatches.map(m => ({
        _id: m.hospital._id,
        name: m.hospital.name,
        address: m.hospital.address,
        emergencyPhone: m.hospital.emergencyPhone,
        location: m.hospital.location,
        distance: m.distance,
        travelTime: m.travelTime,
        icuAvailable: m.hospital.beds?.icuAvailable || 0,
        emergencyAvailable: m.hospital.beds?.emergencyAvailable || 0
      }))
    });
  } catch (error) {
    console.error('Critical emergency dispatch error:', error.message);
    res.status(500).json({
      message: 'Failed to process automated emergency dispatch. Please call emergency services or hospitals directly.',
      emergencyHelplines: ['108 (National Ambulance)', '102 (Medical Intake)', '112 (Universal Emergency)'],
      recommendedHospitals: fallbackHospitals.slice(0, 3).map(h => ({
        _id: h._id,
        name: h.name,
        emergencyPhone: h.emergencyPhone,
        address: h.address,
        isFallback: true
      }))
    });
  }
};

// @desc    Update emergency request status
// @route   PUT /api/emergency/:id
// @access  Private (Hospital admin only)
const updateEmergencyStatus = async (req, res) => {
  try {
    const { status, ambulanceId } = req.body;
    const request = await EmergencyRequest.findById(req.params.id)
      .populate('hospital', 'name user');

    if (!request) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital || request.hospital._id.toString() !== hospital._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to manage this emergency request' });
    }

    request.status = status;
    
    if (status === 'ambulance_assigned' && ambulanceId) {
      const ambulance = await Ambulance.findById(ambulanceId);
      if (ambulance) {
        ambulance.status = 'busy';
        await ambulance.save();
        request.details = (request.details || '') + ` | Ambulance ${ambulance.licensePlate} assigned. Driver: ${ambulance.driverName} (${ambulance.driverContact})`;
      }
    }

    await request.save();

    // Notify patient/user if logged in
    if (request.patient) {
      await Notification.create({
        recipient: request.patient,
        message: `Your emergency request status updated to: ${status.toUpperCase()} by ${request.hospital.name}.`,
        type: 'info'
      });
    }

    // Trigger Socket updates
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(request.hospital.user.toString()).emit('emergency_request_updated', request);
      if (request.patient) {
        io.to(request.patient.toString()).emit('emergency_request_updated', request);
      }
    }

    res.json({ message: `Status updated to ${status}`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHospitalEmergencies = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const requests = await EmergencyRequest.find({ hospital: hospital._id })
      .populate('patient', 'name phone medicalInfo')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initiateEmergency,
  updateEmergencyStatus,
  getHospitalEmergencies
};
