const mongoose = require('mongoose');

const ResourceRequestSchema = new mongoose.Schema({
  requestingHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  providingHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['beds', 'icuBeds', 'blood', 'medicines', 'ventilators', 'ambulances', 'oxygen'],
    required: true,
  },
  details: {
    bloodGroup: { type: String }, // e.g. "Op", "On"
    medicineName: { type: String },
    notes: { type: String }
  },
  quantity: {
    type: Number,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  reason: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'partially_fulfilled', 'rejected', 'in_transit', 'completed', 'cancelled'],
    default: 'pending',
  },
  fulfilledQuantity: {
    type: Number,
    default: 0
  },
  expectedTransferTime: {
    type: Date,
  }
}, { timestamps: true });

ResourceRequestSchema.index({ requestingHospital: 1 });
ResourceRequestSchema.index({ providingHospital: 1 });
ResourceRequestSchema.index({ status: 1 });

module.exports = mongoose.model('ResourceRequest', ResourceRequestSchema);
