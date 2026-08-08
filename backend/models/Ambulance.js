const mongoose = require('mongoose');

const AmbulanceSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
  },
  driverName: {
    type: String,
    required: true,
  },
  driverContact: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'maintenance'],
    default: 'available',
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  }
}, { timestamps: true });

AmbulanceSchema.index({ hospital: 1 });
AmbulanceSchema.index({ status: 1 });

module.exports = mongoose.model('Ambulance', AmbulanceSchema);
