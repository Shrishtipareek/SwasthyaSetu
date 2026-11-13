const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const { emitAll } = require('../utils/notify');
const { sendError, isValidObjectId, isValidLocation, normalizeLocation, missingFields } = require('../utils/http');

const AMBULANCE_STATUSES = Ambulance.schema.path('status').enumValues;

const normalizePlate = (plate) => String(plate).trim().toUpperCase().replace(/\s+/g, '-');

// @desc    Register a new ambulance
// @route   POST /api/ambulances
// @access  Private (Hospital admin only)
const registerAmbulance = async (req, res) => {
  try {
    const { licensePlate, driverName, driverContact, location } = req.body;

    const missing = missingFields(req.body, ['licensePlate', 'driverName', 'driverContact']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    if (location !== undefined && !isValidLocation(location)) {
      return res.status(400).json({ message: 'location must contain valid numeric lat and lng values.' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const plate = normalizePlate(licensePlate);
    if (await Ambulance.exists({ licensePlate: plate })) {
      return res.status(409).json({ message: `An ambulance with license plate ${plate} is already registered.` });
    }

    const ambulance = await Ambulance.create({
      hospital: hospital._id,
      licensePlate: plate,
      driverName: String(driverName).trim(),
      driverContact: String(driverContact).trim(),
      // Copy plain numbers: assigning the hospital's nested Mongoose object is unreliable.
      location: location ? normalizeLocation(location) : { lat: hospital.location.lat, lng: hospital.location.lng },
    });

    emitAll('ambulance_update', ambulance);
    res.status(201).json(ambulance);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get ambulances (all or hospital specific)
// @route   GET /api/ambulances
// @access  Public
const getAmbulances = async (req, res) => {
  try {
    const { hospitalId, status } = req.query;
    const query = {};

    if (hospitalId !== undefined) {
      if (!isValidObjectId(hospitalId)) return res.status(400).json({ message: 'Invalid hospitalId' });
      query.hospital = hospitalId;
    }
    if (status !== undefined) {
      if (!AMBULANCE_STATUSES.includes(status)) {
        return res.status(400).json({ message: `status must be one of: ${AMBULANCE_STATUSES.join(', ')}` });
      }
      query.status = status;
    }

    const ambulances = await Ambulance.find(query).populate('hospital', 'name address contactPhone emergencyPhone');
    res.json(ambulances);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Update ambulance status or location
// @route   PUT /api/ambulances/:id
// @access  Private (Hospital admin only)
const updateAmbulance = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ambulance id' });
    }

    const { status, driverName, driverContact, location } = req.body;
    if (status !== undefined && !AMBULANCE_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${AMBULANCE_STATUSES.join(', ')}` });
    }
    if (location !== undefined && !isValidLocation(location)) {
      return res.status(400).json({ message: 'location must contain valid numeric lat and lng values.' });
    }

    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({ message: 'Ambulance not found' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital || !ambulance.hospital.equals(hospital._id)) {
      return res.status(403).json({ message: 'Not authorized to manage this ambulance' });
    }

    if (status) ambulance.status = status;
    if (typeof driverName === 'string' && driverName.trim()) ambulance.driverName = driverName.trim();
    if (typeof driverContact === 'string' && driverContact.trim()) ambulance.driverContact = driverContact.trim();
    if (location) ambulance.location = normalizeLocation(location);

    await ambulance.save();

    emitAll('ambulance_update', ambulance);
    res.json({ message: 'Ambulance updated successfully', ambulance });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  registerAmbulance,
  getAmbulances,
  updateAmbulance,
};
