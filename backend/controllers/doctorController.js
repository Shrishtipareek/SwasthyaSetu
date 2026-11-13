const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { fallbackDoctors } = require('../utils/fallbackData');

const getDoctors = async (req, res) => {
  try {
    const { hospitalId, specialization, page = 1, limit = 50 } = req.query;
    let query = {};

    if (hospitalId) {
      query.hospital = hospitalId;
    }
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));

    const doctors = await Doctor.find(query)
      .populate('hospital', 'name address contactPhone emergencyPhone')
      .skip(skip)
      .limit(Math.min(100, parseInt(limit)));

    res.json(doctors);
  } catch (error) {
    console.warn('DB error in getDoctors, serving fallback doctors:', error.message);
    const { specialization } = req.query;
    if (specialization) {
      const filtered = fallbackDoctors.filter(d => 
        d.specialization.toLowerCase().includes(specialization.toLowerCase())
      );
      return res.json(filtered.length > 0 ? filtered : fallbackDoctors);
    }
    res.json(fallbackDoctors);
  }
};

const addDoctor = async (req, res) => {
  try {
    const { name, specialization, contact, experience, schedule } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Doctor name is required.' });
    }
    if (!specialization || typeof specialization !== 'string' || specialization.trim().length === 0) {
      return res.status(400).json({ message: 'Doctor specialization is required.' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found for the logged in user' });
    }

    const doctor = await Doctor.create({
      hospital: hospital._id,
      name: name.trim(),
      specialization: specialization.trim(),
      contact: contact ? contact.trim() : hospital.contactPhone,
      experience: Number(experience) || 0,
      schedule: schedule || {
        days: ["Monday", "Wednesday", "Friday"],
        slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"]
      }
    });

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeDoctor = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.hospital.toString() !== hospital._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized to delete doctor from another hospital' });
    }

    await doctor.deleteOne();
    res.json({ message: 'Doctor removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDoctors,
  addDoctor,
  removeDoctor
};
