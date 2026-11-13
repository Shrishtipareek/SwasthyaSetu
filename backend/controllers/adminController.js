const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

const getAllHospitalsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const query = {};
    if (status) {
      query.verifiedStatus = status;
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));

    const hospitals = await Hospital.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(100, parseInt(limit)));

    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyHospital = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status. Must be: verified, rejected, or pending' });
    }

    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    hospital.verifiedStatus = status;
    await hospital.save();

    if (hospital.user) {
      await Notification.create({
        recipient: hospital.user,
        message: `Your hospital verification request has been ${status.toUpperCase()} by SwasthyaSetu administrators.`,
        type: status === 'verified' ? 'info' : 'critical'
      });
    }

    res.json({ message: `Hospital verification status updated to ${status}`, hospital });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminSystemStats = async (req, res) => {
  try {
    const patientsCount = await User.countDocuments({ role: 'patient' });
    const hospitalsCount = await Hospital.countDocuments();
    const verifiedHospitalsCount = await Hospital.countDocuments({ verifiedStatus: 'verified' });
    const pendingHospitalsCount = await Hospital.countDocuments({ verifiedStatus: 'pending' });
    const doctorsCount = await Doctor.countDocuments();
    const appointmentsCount = await Appointment.countDocuments();

    res.json({
      patientsCount,
      hospitalsCount,
      verifiedHospitalsCount,
      pendingHospitalsCount,
      doctorsCount,
      appointmentsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllHospitalsForAdmin,
  verifyHospital,
  getAdminSystemStats
};
