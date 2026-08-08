const mongoose = require('mongoose');

const HealthCampaignSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['blood_camp', 'health_camp', 'vaccination', 'awareness'],
    default: 'awareness',
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true,
  },
  time: {
    type: String, // e.g. "10:00 AM - 04:00 PM"
    required: true,
  },
  venue: {
    type: String,
    required: true,
  },
  registeredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

HealthCampaignSchema.index({ date: 1 });
HealthCampaignSchema.index({ hospital: 1 });

module.exports = mongoose.model('HealthCampaign', HealthCampaignSchema);
