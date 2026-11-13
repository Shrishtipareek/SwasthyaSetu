const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { notify, emitTo } = require('../utils/notify');
const { sendError, isValidObjectId, isValidISODate, todayISO, parsePagination } = require('../utils/http');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BOOKING_SOURCES = Appointment.schema.path('bookingSource').enumValues;
const SLOT_TAKEN_MESSAGE = 'This time slot has already been booked. Please choose another slot.';

/** "02:00 PM" -> 840 so appointments sort chronologically (string sort put PM before AM). */
const slotToMinutes = (slot) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(slot || '').trim());
  if (!m) return Number.MAX_SAFE_INTEGER;
  let hours = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') hours += 12;
  return hours * 60 + Number(m[2]);
};

const clean = (value, max = 1000) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined);

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Patient only)
const bookAppointment = async (req, res) => {
  try {
    const { hospitalId, doctorId, date, timeSlot, reason, notes, bookingSource } = req.body;
    const patientId = req.user._id;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: 'A valid doctorId is required.' });
    }
    if (hospitalId !== undefined && !isValidObjectId(hospitalId)) {
      return res.status(400).json({ message: 'Invalid hospitalId.' });
    }
    if (!isValidISODate(date)) {
      return res.status(400).json({ message: 'date must be a valid date in YYYY-MM-DD format.' });
    }
    if (date < todayISO()) {
      return res.status(400).json({ message: 'Appointments cannot be booked for a past date.' });
    }
    if (typeof timeSlot !== 'string' || !timeSlot.trim()) {
      return res.status(400).json({ message: 'timeSlot is required.' });
    }
    // Accept ranges such as "10:00 AM - 10:30 AM" by booking their start time, so
    // both formats map to the same slot (and the double-booking index still applies).
    const slot = timeSlot.trim().split(/\s*[-–]\s*/)[0].replace(/\s+/g, ' ').toUpperCase().replace(/^(\d):/, '0$1:');

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    // The hospital always comes from the doctor; a mismatching hospitalId used to
    // create appointments for a doctor at a hospital they do not work at.
    if (hospitalId && !doctor.hospital.equals(hospitalId)) {
      return res.status(400).json({ message: 'This doctor does not work at the selected hospital.' });
    }

    const hospital = await Hospital.findById(doctor.hospital);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    if (hospital.verifiedStatus !== 'verified') {
      return res.status(400).json({ message: 'This hospital is not accepting appointments yet.' });
    }
    if (doctor.status === 'on_leave') {
      return res.status(400).json({ message: `Dr. ${doctor.name} is currently on leave. Please choose another doctor.` });
    }

    const slots = (doctor.schedule && doctor.schedule.slots) || [];
    if (slots.length && !slots.includes(slot)) {
      return res.status(400).json({ message: `Dr. ${doctor.name} has no "${slot}" slot. Available slots: ${slots.join(', ')}.` });
    }
    const days = (doctor.schedule && doctor.schedule.days) || [];
    const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
    if (days.length && !days.includes(weekday)) {
      return res.status(400).json({ message: `Dr. ${doctor.name} is not available on ${weekday}s. Available days: ${days.join(', ')}.` });
    }

    const existingAppointment = await Appointment.findOne({ doctor: doctor._id, date, timeSlot: slot, status: 'upcoming' });
    if (existingAppointment) {
      return res.status(409).json({ message: SLOT_TAKEN_MESSAGE });
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patient: patientId,
        hospital: hospital._id,
        doctor: doctor._id,
        date,
        timeSlot: slot,
        reason: clean(reason) || 'General Consultation',
        notes: clean(notes),
        bookingSource: BOOKING_SOURCES.includes(bookingSource) ? bookingSource : 'manual',
      });
    } catch (createErr) {
      // Two patients racing for the same slot: the unique index rejects the second one.
      if (createErr && createErr.code === 11000) {
        return res.status(409).json({ message: SLOT_TAKEN_MESSAGE });
      }
      throw createErr;
    }

    await notify(patientId, `Appointment booked with Dr. ${doctor.name} at ${hospital.name} on ${date} at ${slot}.`, 'info');
    await notify(hospital.user, `New appointment booked for Dr. ${doctor.name} on ${date} at ${slot}.`, 'info');
    emitTo([hospital.user, hospital._id], 'new_appointment', appointment);

    res.status(201).json(appointment);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      if (!hospital) {
        return res.status(404).json({ message: 'Hospital profile not found' });
      }
      query.hospital = hospital._id;
    }
    // admin / superadmin see everything

    if (req.query.status) {
      const statuses = Appointment.schema.path('status').enumValues;
      if (!statuses.includes(req.query.status)) {
        return res.status(400).json({ message: `status must be one of: ${statuses.join(', ')}` });
      }
      query.status = req.query.status;
    }

    const { skip, limit } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('hospital', 'name address emergencyPhone contactPhone')
      .populate('doctor', 'name specialization')
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(limit);

    // String sorting puts "02:00 PM" before "09:00 AM"; fix the order within each day.
    appointments.sort((a, b) => (a.date === b.date ? slotToMinutes(a.timeSlot) - slotToMinutes(b.timeSlot) : a.date < b.date ? -1 : 1));

    res.json(appointments);
  } catch (error) {
    // Previously any error returned an empty list, hiding real failures.
    sendError(res, error);
  }
};

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name')
      .populate('hospital', 'name user');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const role = req.user.role;
    if (role === 'patient' && !appointment.patient.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }
    if (role === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      const appointmentHospitalId = appointment.hospital ? appointment.hospital._id : null;
      if (!hospital || !appointmentHospitalId || !appointmentHospitalId.equals(hospital._id)) {
        return res.status(403).json({ message: 'Not authorized to cancel this hospital appointment' });
      }
    }

    if (appointment.status !== 'upcoming') {
      return res.status(400).json({ message: `Only upcoming appointments can be cancelled (this one is ${appointment.status}).` });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // The doctor or hospital may have been removed since booking.
    const doctorName = appointment.doctor ? `Dr. ${appointment.doctor.name}` : 'your doctor';
    const hospitalName = appointment.hospital ? appointment.hospital.name : 'the hospital';
    const cancelledBy = role === 'patient' ? 'the patient' : role === 'hospital' ? hospitalName : 'an administrator';

    await notify(appointment.patient, `Appointment with ${doctorName} at ${hospitalName} on ${appointment.date} at ${appointment.timeSlot} was cancelled by ${cancelledBy}.`, 'warning');
    if (appointment.hospital) {
      await notify(appointment.hospital.user, `Appointment with ${doctorName} on ${appointment.date} at ${appointment.timeSlot} was cancelled by ${cancelledBy}.`, 'warning');
    }

    emitTo(appointment.patient, 'appointment_cancelled', appointment);
    if (appointment.hospital) emitTo([appointment.hospital.user, appointment.hospital._id], 'appointment_cancelled', appointment);

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  cancelAppointment,
  slotToMinutes,
};
