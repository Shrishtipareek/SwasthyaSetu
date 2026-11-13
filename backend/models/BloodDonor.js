const mongoose = require('mongoose');

const BloodDonorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one donor registration per user
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
  },
  cityArea: {
    type: String,
    required: true,
  },
  availabilityStatus: {
    type: Boolean,
    default: true,
  },
  contactPreference: {
    type: String,
    enum: ['Phone', 'Email', 'SwasthyaSetu Chat'],
    default: 'Phone',
  },
  lastDonationDate: {
    type: Date,
  }
}, { timestamps: true });

BloodDonorSchema.index({ bloodGroup: 1, cityArea: 1 });
BloodDonorSchema.index({ availabilityStatus: 1 });

module.exports = mongoose.model('BloodDonor', BloodDonorSchema);
