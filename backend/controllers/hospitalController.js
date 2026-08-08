const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Ambulance = require('../models/Ambulance');
const ResourceRequest = require('../models/ResourceRequest');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

// Helper to calculate distance in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// @desc    Get all hospitals with optional search/filters
// @route   GET /api/hospitals
// @access  Public
const getHospitals = async (req, res) => {
  try {
    const { name, location, department, specialization, needsEmergency, needsIcu, needsBlood, lat, lng, maxDistance } = req.query;

    let query = { verifiedStatus: 'verified' };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (location) {
      query.address = { $regex: location, $options: 'i' };
    }

    if (department) {
      query.departments = { $in: [department] };
    }

    if (needsEmergency === 'true') {
      query['beds.emergencyAvailable'] = { $gt: 0 };
    }

    if (needsIcu === 'true') {
      query['beds.icuAvailable'] = { $gt: 0 };
    }

    if (needsBlood) {
      // e.g. needsBlood=Op
      query[`bloodInventory.${needsBlood}.availableUnits`] = { $gt: 0 };
    }

    let hospitals = await Hospital.find(query);

    // If coordinates are provided, sort by distance and filter by maxDistance
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      hospitals = hospitals.map(h => {
        const distance = calculateDistance(userLat, userLng, h.location.lat, h.location.lng);
        return { ...h.toObject(), distance };
      });

      // Filter by maxDistance if supplied
      if (maxDistance) {
        const maxDistNum = parseFloat(maxDistance);
        hospitals = hospitals.filter(h => h.distance <= maxDistNum);
      }

      // Sort by distance
      hospitals.sort((a, b) => a.distance - b.distance);
    }

    // Filter by doctor specialization if specified (need to look up doctors)
    if (specialization) {
      const doctors = await Doctor.find({ specialization: { $regex: specialization, $options: 'i' } });
      const hospitalIds = doctors.map(d => d.hospital.toString());
      hospitals = hospitals.filter(h => hospitalIds.includes(h._id.toString()));
    }

    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public aggregate stats for public dashboard
// @route   GET /api/hospitals/stats
// @access  Public
const getPublicStats = async (req, res) => {
  try {
    const hospitals = await Hospital.find({ verifiedStatus: 'verified' });

    let totalBeds = 0;
    let availableBeds = 0;
    let totalIcu = 0;
    let availableIcu = 0;
    let bloodUnits = 0;

    hospitals.forEach(h => {
      totalBeds += h.beds.total || 0;
      availableBeds += h.beds.available || 0;
      totalIcu += h.beds.icuTotal || 0;
      availableIcu += h.beds.icuAvailable || 0;
      
      // Sum all blood units
      if (h.bloodInventory) {
        Object.keys(h.bloodInventory).forEach(group => {
          bloodUnits += h.bloodInventory[group].availableUnits || 0;
        });
      }
    });

    const ambulancesCount = await Ambulance.countDocuments({ status: 'available' });
    const emergencyHospitalsCount = hospitals.filter(h => h.beds.emergencyAvailable > 0).length;

    res.json({
      hospitalsConnected: hospitals.length,
      availableBeds,
      totalBeds,
      availableIcuBeds: availableIcu,
      totalIcuBeds: totalIcu,
      availableAmbulances: ambulancesCount,
      bloodUnitsAvailable: bloodUnits,
      emergencyHospitals: emergencyHospitalsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single hospital by ID
// @route   GET /api/hospitals/:id
// @access  Public
const getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const doctors = await Doctor.find({ hospital: hospital._id });
    const ambulances = await Ambulance.find({ hospital: hospital._id });

    res.json({
      hospital,
      doctors,
      ambulances
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update real-time resources/inventory
// @route   PUT /api/hospitals/resources
// @access  Private (Hospital admin only)
const updateResources = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found for this user' });
    }

    const { beds, bloodInventory, organs, thresholds } = req.body;

    if (beds) {
      hospital.beds = { ...hospital.beds, ...beds };
      // Recalculate available total beds
      if (beds.occupied !== undefined || beds.total !== undefined) {
        const total = beds.total !== undefined ? beds.total : hospital.beds.total;
        const occupied = beds.occupied !== undefined ? beds.occupied : hospital.beds.occupied;
        hospital.beds.available = Math.max(0, total - occupied);
      }
    }

    if (bloodInventory) {
      Object.keys(bloodInventory).forEach(group => {
        if (hospital.bloodInventory[group]) {
          hospital.bloodInventory[group].availableUnits = bloodInventory[group].availableUnits;
          hospital.bloodInventory[group].lastUpdated = Date.now();
        }
      });
    }

    if (organs) {
      Object.keys(organs).forEach(org => {
        if (hospital.organs[org]) {
          hospital.organs[org].available = organs[org].available;
          hospital.organs[org].lastUpdated = Date.now();
        }
      });
    }

    if (thresholds) {
      hospital.thresholds = { ...hospital.thresholds, ...thresholds };
    }

    await hospital.save();

    // Check critical thresholds and trigger notifications/alerts
    const alerts = [];
    if (hospital.beds.icuAvailable <= hospital.thresholds.icuLow) {
      alerts.push(`ICU Beds are low: only ${hospital.beds.icuAvailable} available.`);
    }
    if (hospital.beds.emergencyAvailable <= hospital.thresholds.emergencyLow) {
      alerts.push(`Emergency Beds are low: only ${hospital.beds.emergencyAvailable} available.`);
    }

    Object.keys(hospital.bloodInventory).forEach(group => {
      const units = hospital.bloodInventory[group].availableUnits;
      if (units <= hospital.thresholds.bloodCritical) {
        alerts.push(`CRITICAL: Blood group ${group.replace('p', '+').replace('n', '-')} is critically low (${units} units remaining).`);
      } else if (units <= hospital.thresholds.bloodLow) {
        alerts.push(`WARNING: Blood group ${group.replace('p', '+').replace('n', '-')} is low (${units} units remaining).`);
      }
    });

    if (alerts.length > 0) {
      for (const alertMsg of alerts) {
        await Notification.create({
          recipient: req.user._id,
          message: alertMsg,
          type: alertMsg.includes('CRITICAL') ? 'critical' : 'warning'
        });
      }
    }

    // Trigger Socket.io real-time resource update
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.emit('resource_update', {
        hospitalId: hospital._id,
        name: hospital.name,
        beds: hospital.beds,
        bloodInventory: hospital.bloodInventory,
        organs: hospital.organs
      });
    }

    res.json({ message: 'Resources updated successfully', hospital });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Stats for Hospital Admin Dashboard
// @route   GET /api/hospitals/dashboard/stats
// @access  Private (Hospital admin only)
const getHospitalDashboardStats = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const doctorsCount = await Doctor.countDocuments({ hospital: hospital._id });
    const ambulancesCount = await Ambulance.countDocuments({ hospital: hospital._id });
    const appointmentsCount = await Appointment.countDocuments({ hospital: hospital._id });
    const pendingRequestsCount = await ResourceRequest.countDocuments({
      providingHospital: hospital._id,
      status: 'pending'
    });

    const recentRequests = await ResourceRequest.find({
      $or: [
        { requestingHospital: hospital._id },
        { providingHospital: hospital._id }
      ]
    })
    .populate('requestingHospital', 'name')
    .populate('providingHospital', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

    const recentAppointments = await Appointment.find({ hospital: hospital._id })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      hospital,
      doctorsCount,
      ambulancesCount,
      appointmentsCount,
      pendingRequestsCount,
      recentRequests,
      recentAppointments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHospitals,
  getPublicStats,
  getHospitalById,
  updateResources,
  getHospitalDashboardStats
};
