const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Patient/User only)
const bookAppointment = async (req, res) => {
  try {
    const { hospitalId, doctorId, date, timeSlot, reason, notes, bookingSource } = req.body;
    const patientId = req.user._id;

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date,
      timeSlot,
      status: 'upcoming'
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This time slot has already been booked. Please choose another slot.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const appointment = await Appointment.create({
      patient: patientId,
      hospital: hospitalId,
      doctor: doctorId,
      date,
      timeSlot,
      reason,
      notes,
      bookingSource: bookingSource || 'manual'
    });

    // Create notifications for patient and hospital
    await Notification.create({
      recipient: patientId,
      message: `Appointment booked with Dr. ${doctor.name} at ${hospital.name} on ${date} at ${timeSlot}.`,
      type: 'info'
    });

    await Notification.create({
      recipient: hospital.user,
      message: `New appointment booked for Dr. ${doctor.name} on ${date} at ${timeSlot}.`,
      type: 'info'
    });

    // Trigger Socket.io real-time update if applicable
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(hospital.user.toString()).emit('new_appointment', appointment);
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      if (!hospital) {
        return res.status(404).json({ message: 'Hospital profile not found' });
      }
      query.hospital = hospital._id;
    } else if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      // Admin sees everything
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('hospital', 'name address emergencyPhone contactPhone')
      .populate('doctor', 'name specialization')
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name')
      .populate('hospital', 'name user');
      
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify ownership
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      if (!hospital || appointment.hospital.toString() !== hospital._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to cancel this hospital appointment' });
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Notify patient
    await Notification.create({
      recipient: appointment.patient,
      message: `Appointment with Dr. ${appointment.doctor.name} at ${appointment.hospital.name} has been cancelled.`,
      type: 'warning'
    });

    // Notify hospital
    await Notification.create({
      recipient: appointment.hospital.user,
      message: `Appointment with Dr. ${appointment.doctor.name} on ${appointment.date} has been cancelled.`,
      type: 'warning'
    });

    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(appointment.patient.toString()).emit('appointment_cancelled', appointment);
      io.to(appointment.hospital.user.toString()).emit('appointment_cancelled', appointment);
    }

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  cancelAppointment
};
