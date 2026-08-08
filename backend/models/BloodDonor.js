const mongoose = require('mongoose');

const BloodDonorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
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
