const mongoose = require('mongoose');

const EmergencyRequestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Allow guest users
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  requestType: {
    type: String,
    enum: ['bed', 'icu', 'ambulance', 'blood', 'oxygen', 'doctor', 'nearby_hospital'],
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  contactNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'ambulance_assigned', 'completed'],
    default: 'requested',
  },
  distance: {
    type: Number, // in km
  },
  travelTime: {
    type: String, // e.g. "12 mins"
  },
  details: {
    type: String,
  }
}, { timestamps: true });

EmergencyRequestSchema.index({ hospital: 1 });
EmergencyRequestSchema.index({ status: 1 });

module.exports = mongoose.model('EmergencyRequest', EmergencyRequestSchema);
