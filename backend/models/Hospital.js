const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  emergencyPhone: {
    type: String,
    required: true,
  },
  contactPhone: {
    type: String,
    required: true,
  },
  website: {
    type: String,
  },
  hospitalType: {
    type: String,
    enum: ['Government', 'Private', 'Charitable', 'Clinic'],
    default: 'Private',
  },
  facilities: {
    type: [String],
    default: ['Emergency Room', 'Pharmacy', 'Diagnostic Lab'],
  },
  departments: {
    type: [String],
    default: ['General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics'],
  },
  operatingHours: {
    type: String,
    default: '24/7',
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  verifiedStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  // Real-Time Bed Resources
  beds: {
    total: { type: Number, default: 50 },
    occupied: { type: Number, default: 20 },
    available: { type: Number, default: 30 },
    icuTotal: { type: Number, default: 10 },
    icuAvailable: { type: Number, default: 5 },
    emergencyTotal: { type: Number, default: 10 },
    emergencyAvailable: { type: Number, default: 8 },
    ventilatorsTotal: { type: Number, default: 5 },
    ventilatorsAvailable: { type: Number, default: 3 },
  },
  // Real-Time Blood Inventory
  bloodInventory: {
    'Ap': { availableUnits: { type: Number, default: 10 }, lastUpdated: { type: Date, default: Date.now } },
    'An': { availableUnits: { type: Number, default: 5 }, lastUpdated: { type: Date, default: Date.now } },
    'Bp': { availableUnits: { type: Number, default: 10 }, lastUpdated: { type: Date, default: Date.now } },
    'Bn': { availableUnits: { type: Number, default: 5 }, lastUpdated: { type: Date, default: Date.now } },
    'Op': { availableUnits: { type: Number, default: 15 }, lastUpdated: { type: Date, default: Date.now } },
    'On': { availableUnits: { type: Number, default: 4 }, lastUpdated: { type: Date, default: Date.now } },
    'ABp': { availableUnits: { type: Number, default: 5 }, lastUpdated: { type: Date, default: Date.now } },
    'ABn': { availableUnits: { type: Number, default: 2 }, lastUpdated: { type: Date, default: Date.now } },
  },
  // Organs Availability (Anonymized)
  organs: {
    kidney: { available: { type: Number, default: 0 }, lastUpdated: { type: Date, default: Date.now } },
    liver: { available: { type: Number, default: 0 }, lastUpdated: { type: Date, default: Date.now } },
    heart: { available: { type: Number, default: 0 }, lastUpdated: { type: Date, default: Date.now } },
    lungs: { available: { type: Number, default: 0 }, lastUpdated: { type: Date, default: Date.now } },
  },
  // Critical Low Resource Threshold Configurations
  thresholds: {
    bloodLow: { type: Number, default: 5 },
    bloodCritical: { type: Number, default: 2 },
    icuLow: { type: Number, default: 2 },
    emergencyLow: { type: Number, default: 2 }
  }
}, { timestamps: true });

HospitalSchema.index({ name: 1 });
HospitalSchema.index({ 'location': '2d' });
HospitalSchema.index({ verifiedStatus: 1 });

module.exports = mongoose.model('Hospital', HospitalSchema);
