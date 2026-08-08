const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

// @desc    Get all hospitals (pending or all) for superadmin view
// @route   GET /api/admin/hospitals
// @access  Private (Admin/Superadmin only)
const getAllHospitalsForAdmin = async (req, res) => {
  try {
    const hospitals = await Hospital.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Verify or Reject a hospital registration
// @route   PUT /api/admin/hospitals/:id/verify
// @access  Private (Admin/Superadmin only)
const verifyHospital = async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    hospital.verifiedStatus = status;
    await hospital.save();

    // Notify hospital user
    await Notification.create({
      recipient: hospital.user,
      message: `Your hospital verification request has been ${status.toUpperCase()} by SwasthyaSetu administrators.`,
      type: status === 'verified' ? 'info' : 'critical'
    });

    res.json({ message: `Hospital verification status updated to ${status}`, hospital });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system-wide stats
// @route   GET /api/admin/stats
// @access  Private (Admin/Superadmin only)
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
