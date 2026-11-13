const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');
const { notify } = require('../utils/notify');
const { fallbackDoctors } = require('../utils/fallbackData');
const { sendError, isDbConnected, isValidObjectId, escapeRegex, isNumeric, missingFields, parsePagination } = require('../utils/http');

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOT_REGEX = /^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;
const DOCTOR_STATUSES = Doctor.schema.path('status').enumValues;

// Demo data (utils/fallbackData) served only while the database is unreachable.
const seedDoctorsFallback = fallbackDoctors;

/** Validate an optional { days, slots } schedule; returns { schedule } or { error }. */
const parseSchedule = (schedule) => {
  if (schedule === undefined || schedule === null) return { schedule: undefined };
  if (typeof schedule !== 'object') return { error: 'schedule must be an object with days and slots arrays.' };
  const result = {};
  if (schedule.days !== undefined) {
    if (!Array.isArray(schedule.days) || !schedule.days.length || !schedule.days.every((d) => WEEKDAYS.includes(d))) {
      return { error: `schedule.days must be a non-empty list of: ${WEEKDAYS.join(', ')}` };
    }
    result.days = [...new Set(schedule.days)];
  }
  if (schedule.slots !== undefined) {
    if (!Array.isArray(schedule.slots) || !schedule.slots.length || !schedule.slots.every((s) => SLOT_REGEX.test(String(s)))) {
      return { error: 'schedule.slots must be a non-empty list of times such as "09:00 AM".' };
    }
    result.slots = [...new Set(schedule.slots.map(String))];
  }
  return { schedule: result };
};

// @desc    Get all doctors or doctors for a specific hospital
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const { hospitalId, specialization } = req.query;

    // An invalid id used to throw, which made the endpoint return the fake fallback list.
    if (hospitalId !== undefined && !isValidObjectId(hospitalId)) {
      return res.status(400).json({ message: 'Invalid hospitalId' });
    }

    if (!isDbConnected()) {
      res.set('X-Data-Source', 'fallback');
      const spec = specialization ? String(specialization).toLowerCase() : null;
      return res.json(
        seedDoctorsFallback.filter(
          (d) => (!hospitalId || d.hospital._id === hospitalId) && (!spec || d.specialization.toLowerCase().includes(spec))
        )
      );
    }

    const query = {};
    if (hospitalId) query.hospital = hospitalId;
    if (specialization) query.specialization = { $regex: escapeRegex(specialization), $options: 'i' };

    const { skip, limit } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
    const doctors = await Doctor.find(query)
      .populate('hospital', 'name address contactPhone emergencyPhone')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    res.json(doctors);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Create/Add a new doctor
// @route   POST /api/doctors
// @access  Private (Hospital admin only)
const addDoctor = async (req, res) => {
  try {
    const { name, specialization, contact, experience, status } = req.body;

    const missing = missingFields(req.body, ['name', 'specialization']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    if (experience !== undefined && experience !== '' && (!isNumeric(experience) || Number(experience) < 0 || Number(experience) > 70)) {
      return res.status(400).json({ message: 'experience must be a number of years between 0 and 70.' });
    }
    if (status !== undefined && !DOCTOR_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${DOCTOR_STATUSES.join(', ')}` });
    }
    const { schedule, error: scheduleError } = parseSchedule(req.body.schedule);
    if (scheduleError) {
      return res.status(400).json({ message: scheduleError });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found for the logged in user' });
    }

    const doctor = await Doctor.create({
      hospital: hospital._id,
      name: String(name).trim().replace(/^dr\.?\s+/i, ''), // the UI already prefixes "Dr."
      specialization: String(specialization).trim(),
      // Without a direct number, patients can reach the doctor through the hospital.
      contact: typeof contact === 'string' && contact.trim() ? contact.trim() : hospital.contactPhone,
      experience: experience === undefined || experience === '' ? undefined : Number(experience),
      schedule,
      status,
    });

    res.status(201).json(doctor);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Delete/Remove a doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Hospital admin only)
const removeDoctor = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid doctor id' });
    }

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (!doctor.hospital.equals(hospital._id)) {
      return res.status(403).json({ message: 'Unauthorized to delete doctor from another hospital' });
    }

    // Cancel the doctor's upcoming appointments and tell the patients, instead of
    // leaving appointments that point at a deleted doctor.
    const upcoming = await Appointment.find({ doctor: doctor._id, status: 'upcoming' }).select('patient date timeSlot');
    if (upcoming.length) {
      await Appointment.updateMany({ _id: { $in: upcoming.map((a) => a._id) } }, { status: 'cancelled' });
      for (const appt of upcoming) {
        await notify(
          appt.patient,
          `Your appointment with Dr. ${doctor.name} at ${hospital.name} on ${appt.date} at ${appt.timeSlot} was cancelled because the doctor is no longer available. Please book another doctor.`,
          'warning'
        );
      }
    }

    await doctor.deleteOne();
    res.json({ message: 'Doctor removed successfully', cancelledAppointments: upcoming.length });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  getDoctors,
  addDoctor,
  removeDoctor,
};
