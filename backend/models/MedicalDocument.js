const mongoose = require('mongoose');

const MedicalDocumentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['prescription', 'lab_report', 'discharge_summary', 'other'],
    required: true,
  },
  notes: {
    type: String,
  },
  fileUrl: {
    type: String, // Simulated document URL or base64 representation
    required: true,
  },
  uploadedByHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  }
}, { timestamps: true });

MedicalDocumentSchema.index({ patient: 1 });

module.exports = mongoose.model('MedicalDocument', MedicalDocumentSchema);
