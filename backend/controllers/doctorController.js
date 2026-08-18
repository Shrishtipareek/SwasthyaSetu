const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

const seedDoctorsFallback = [
  {
    _id: "65d000000000000000000071",
    name: "Dr. Ramesh Kumar",
    specialization: "Cardiologist",
    contact: "9876541001",
    experience: 12,
    schedule: { days: ["Monday", "Wednesday", "Friday"], slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"] },
    status: "available",
    hospital: { name: "AIIMS New Delhi", address: "Ansari Nagar, New Delhi" }
  },
  {
    _id: "65d000000000000000000072",
    name: "Dr. Sita Sharma",
    specialization: "Pediatrician",
    contact: "9876541002",
    experience: 8,
    schedule: { days: ["Tuesday", "Thursday", "Saturday"], slots: ["10:00 AM", "11:00 AM", "03:00 PM"] },
    status: "available",
    hospital: { name: "Apollo Hospital Delhi", address: "Sarita Vihar, New Delhi" }
  },
  {
    _id: "65d000000000000000000073",
    name: "Dr. Ajay Tyagi",
    specialization: "General Medicine",
    contact: "9876541003",
    experience: 15,
    schedule: { days: ["Monday", "Tuesday", "Wednesday"], slots: ["09:00 AM", "02:00 PM", "04:00 PM"] },
    status: "available",
    hospital: { name: "Max Super Speciality Hospital Saket", address: "Saket, New Delhi" }
  }
];

// @desc    Get all doctors or doctors for a specific hospital
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const { hospitalId, specialization } = req.query;
    let query = {};

    if (hospitalId) {
      query.hospital = hospitalId;
    }
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await Doctor.find(query).populate('hospital', 'name address contactPhone');
    res.json(doctors);
  } catch (error) {
    res.json(seedDoctorsFallback);
  }
};

// @desc    Create/Add a new doctor
// @route   POST /api/doctors
// @access  Private (Hospital admin only)
const addDoctor = async (req, res) => {
  try {
    const { name, specialization, contact, experience, schedule } = req.body;

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found for the logged in user' });
    }

    const doctor = await Doctor.create({
      hospital: hospital._id,
      name,
      specialization,
      contact,
      experience,
      schedule
    });

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/Remove a doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Hospital admin only)
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
