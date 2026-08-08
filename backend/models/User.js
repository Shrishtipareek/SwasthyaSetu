const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['patient', 'hospital', 'admin', 'superadmin'],
    default: 'patient',
  },
  phone: {
    type: String,
    required: true,
  },
  location: {
    lat: { type: Number, default: 28.6139 }, // Default to New Delhi coordinates
    lng: { type: Number, default: 77.2090 }
  },
  // Patient medical info fields
  medicalInfo: {
    dob: { type: Date },
    gender: { type: String },
    bloodGroup: { type: String },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    emergencyContactRelation: { type: String }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ 'location': '2d' }); // index location for map searches

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
