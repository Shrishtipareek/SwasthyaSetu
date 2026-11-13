const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { notify } = require('../utils/notify');
const { sendError, isValidObjectId, parsePagination } = require('../utils/http');

const VERIFICATION_STATUSES = Hospital.schema.path('verifiedStatus').enumValues;

// @desc    Get all hospitals (optionally ?status=pending|verified|rejected&page=&limit=) for admin view
// @route   GET /api/admin/hospitals
// @access  Private (Admin/Superadmin only)
const getAllHospitalsForAdmin = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && req.query.status !== 'all') {
      if (!VERIFICATION_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: `status must be one of: ${VERIFICATION_STATUSES.join(', ')}` });
      }
      query.verifiedStatus = req.query.status;
    }
    const { skip, limit } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });

    const hospitals = await Hospital.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(hospitals);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Approve/Verify, Reject, or move a hospital back to pending review
// @route   PUT /api/admin/hospitals/:id/verify
// @access  Private (Admin/Superadmin only)
const verifyHospital = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VERIFICATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid verification status. Must be: ${VERIFICATION_STATUSES.join(', ')}` });
    }
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid hospital id' });
    }

    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    hospital.verifiedStatus = status;
    await hospital.save();

    // notify() skips hospitals without a linked user account.
    await notify(
      hospital.user,
      status === 'pending'
        ? 'Your hospital registration has been moved back to PENDING review by SwasthyaSetu administrators.'
        : `Your hospital verification request has been ${status.toUpperCase()} by SwasthyaSetu administrators.`,
      status === 'verified' ? 'info' : status === 'pending' ? 'warning' : 'critical'
    );

    res.json({ message: `Hospital verification status updated to ${status}`, hospital });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get system-wide stats
// @route   GET /api/admin/stats
// @access  Private (Admin/Superadmin only)
const getAdminSystemStats = async (req, res) => {
  try {
    const [
      patientsCount,
      hospitalsCount,
      verifiedHospitalsCount,
      pendingHospitalsCount,
      doctorsCount,
      appointmentsCount,
      upcomingAppointmentsCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Hospital.countDocuments(),
      Hospital.countDocuments({ verifiedStatus: 'verified' }),
      Hospital.countDocuments({ verifiedStatus: 'pending' }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'upcoming' }),
    ]);

    res.json({
      patientsCount,
      hospitalsCount,
      verifiedHospitalsCount,
      pendingHospitalsCount,
      doctorsCount,
      appointmentsCount,
      upcomingAppointmentsCount,
    });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  getAllHospitalsForAdmin,
  verifyHospital,
  getAdminSystemStats,
};
