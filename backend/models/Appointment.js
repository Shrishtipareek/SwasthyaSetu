const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  bookingSource: {
    type: String,
    enum: ['manual', 'ai'],
    default: 'manual',
  },
  reason: {
    type: String,
  },
  notes: {
    type: String,
  }
}, { timestamps: true });

AppointmentSchema.index({ patient: 1 });
AppointmentSchema.index({ hospital: 1 });
AppointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 }, { unique: true }); // Prevent double bookings

module.exports = mongoose.model('Appointment', AppointmentSchema);
