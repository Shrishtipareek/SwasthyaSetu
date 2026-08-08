const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');

// @desc    Register a new ambulance
// @route   POST /api/ambulances
// @access  Private (Hospital admin only)
const registerAmbulance = async (req, res) => {
  try {
    const { licensePlate, driverName, driverContact, location } = req.body;

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const ambulance = await Ambulance.create({
      hospital: hospital._id,
      licensePlate,
      driverName,
      driverContact,
      location: location || hospital.location
    });

    res.status(201).json(ambulance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ambulances (all or hospital specific)
// @route   GET /api/ambulances
// @access  Public
const getAmbulances = async (req, res) => {
  try {
    const { hospitalId, status } = req.query;
    let query = {};

    if (hospitalId) {
      query.hospital = hospitalId;
    }
    if (status) {
      query.status = status;
    }

    const ambulances = await Ambulance.find(query).populate('hospital', 'name address contactPhone emergencyPhone');
    res.json(ambulances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ambulance status or location
// @route   PUT /api/ambulances/:id
// @access  Private (Hospital admin only)
const updateAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({ message: 'Ambulance not found' });
    }

    // Verify hospital owns the ambulance
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital || ambulance.hospital.toString() !== hospital._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to manage this ambulance' });
    }

    const { status, driverName, driverContact, location } = req.body;

    if (status) ambulance.status = status;
    if (driverName) ambulance.driverName = driverName;
    if (driverContact) ambulance.driverContact = driverContact;
    if (location) ambulance.location = location;

    await ambulance.save();

    // Trigger Socket.io real-time update
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.emit('ambulance_update', ambulance);
    }

    res.json({ message: 'Ambulance updated successfully', ambulance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerAmbulance,
  getAmbulances,
  updateAmbulance
};
