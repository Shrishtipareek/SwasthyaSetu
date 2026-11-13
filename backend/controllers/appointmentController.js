const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');

const bookAppointment = async (req, res) => {
  try {
    const { hospitalId, doctorId, date, timeSlot, reason, notes, bookingSource } = req.body;
    const patientId = req.user._id;

    if (!hospitalId || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Hospital ID, Doctor ID, date, and time slot are required.' });
    }

    // Validate that appointment date is not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(appointmentDate.getTime()) || appointmentDate < today) {
      return res.status(400).json({ message: 'Appointment date must be today or a future date.' });
    }

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
      reason: reason || 'General Consultation',
      notes,
      bookingSource: bookingSource || 'manual'
    });

    await Notification.create({
      recipient: patientId,
      message: `Appointment booked with Dr. ${doctor.name} at ${hospital.name} on ${date} at ${timeSlot}.`,
      type: 'info'
    });

    if (hospital.user) {
      await Notification.create({
        recipient: hospital.user,
        message: `New appointment booked for Dr. ${doctor.name} on ${date} at ${timeSlot}.`,
        type: 'info'
      });
    }

    if (req.app.get('socketio') && hospital.user) {
      const io = req.app.get('socketio');
      io.to(hospital.user.toString()).emit('new_appointment', appointment);
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      // Admins see all
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('hospital', 'name address emergencyPhone contactPhone')
      .populate('doctor', 'name specialization')
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(Math.min(100, parseInt(limit)));

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error.message);
    res.status(500).json({ message: 'Failed to fetch appointments: ' + error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name')
      .populate('hospital', 'name user');
      
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      const appointmentHospitalId = appointment.hospital?._id ? appointment.hospital._id.toString() : appointment.hospital?.toString();
      if (!hospital || appointmentHospitalId !== hospital._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to cancel this hospital appointment' });
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const doctorName = appointment.doctor?.name || 'Assigned Doctor';
    const hospitalName = appointment.hospital?.name || 'Hospital';

    await Notification.create({
      recipient: appointment.patient,
      message: `Appointment with Dr. ${doctorName} at ${hospitalName} has been cancelled.`,
      type: 'warning'
    });

    if (appointment.hospital?.user) {
      await Notification.create({
        recipient: appointment.hospital.user,
        message: `Appointment with Dr. ${doctorName} on ${appointment.date} has been cancelled.`,
        type: 'warning'
      });
    }

    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.to(appointment.patient.toString()).emit('appointment_cancelled', appointment);
      if (appointment.hospital?.user) {
        io.to(appointment.hospital.user.toString()).emit('appointment_cancelled', appointment);
      }
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
