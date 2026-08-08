const EmergencyRequest = require('../models/EmergencyRequest');
const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const Notification = require('../models/Notification');

// Helper to calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Initiate an emergency request (finds matching hospitals & logs request)
// @route   POST /api/emergency
// @access  Public (guests and patients)
const initiateEmergency = async (req, res) => {
  try {
    const { requestType, location, contactNumber, details } = req.body;
    const patientId = req.user ? req.user._id : null;

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'User location coordinates are required.' });
    }

    // Find all verified hospitals
    const hospitals = await Hospital.find({ verifiedStatus: 'verified' });
    
    // Sort hospitals based on distance and resource type availability
    const matches = hospitals.map(h => {
      const distance = calculateDistance(location.lat, location.lng, h.location.lat, h.location.lng);
      
      // Determine resource availability score based on request type
      let available = false;
      let qty = 0;
      
      switch(requestType) {
        case 'bed':
          available = h.beds.emergencyAvailable > 0;
          qty = h.beds.emergencyAvailable;
          break;
        case 'icu':
          available = h.beds.icuAvailable > 0;
          qty = h.beds.icuAvailable;
          break;
        case 'ambulance':
          available = true; // We check ambulance availability next
          qty = 1;
          break;
        case 'blood':
          available = Object.values(h.bloodInventory).some(g => g.availableUnits > 0);
          qty = 1;
          break;
        case 'oxygen':
          available = h.facilities.includes('Oxygen Plant') || h.facilities.includes('Oxygen Cylinder');
          qty = 1;
          break;
        case 'doctor':
          available = h.beds.available > 0; // fallback proxy
          qty = 1;
          break;
        default:
          available = true;
          qty = 1;
      }

      // travel time estimation proxy: 1 km = 2.5 minutes average city traffic speed
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

    // Sort: Available first, then distance
    matches.sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      return a.distance - b.distance;
    });

    const bestMatches = matches.slice(0, 5); // top 5 choices

    if (bestMatches.length === 0) {
      return res.status(404).json({ message: 'No nearby verified hospitals found.' });
    }

    // Auto-assign the request to the first/closest hospital
    const targetMatch = bestMatches[0];
    const emergencyRequest = await EmergencyRequest.create({
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

    // Notify assigned hospital user
    await Notification.create({
      recipient: targetMatch.hospital.user,
      message: `CRITICAL: New Emergency Intake Request (${requestType}) from ${contactNumber}. Distance: ${targetMatch.distance.toFixed(1)} km.`,
      type: 'critical'
    });

    // Emit Socket.IO real-time alert to hospital admin and globally
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(targetMatch.hospital.user.toString()).emit('emergency_alert_received', emergencyRequest);
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
        icuAvailable: m.hospital.beds.icuAvailable,
        emergencyAvailable: m.hospital.beds.emergencyAvailable
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

// @desc    Get active emergency requests for hospital
// @route   GET /api/emergency/hospital
// @access  Private (Hospital admin only)
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
