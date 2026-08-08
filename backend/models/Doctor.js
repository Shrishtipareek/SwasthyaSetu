const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
  },
  experience: {
    type: Number, // in years
    default: 5
  },
  schedule: {
    days: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    slots: {
      type: [String],
      default: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
    }
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'on_leave'],
    default: 'available'
  }
}, { timestamps: true });

DoctorSchema.index({ hospital: 1 });
DoctorSchema.index({ specialization: 1 });

module.exports = mongoose.model('Doctor', DoctorSchema);
