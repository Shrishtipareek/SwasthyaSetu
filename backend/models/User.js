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
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // never returned by queries unless explicitly requested
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
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    }
  }
});

UserSchema.index({ 'location': '2d' }); // index location for map searches

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) return false;
  return bcrypt.compare(String(enteredPassword), this.password);
};

module.exports = mongoose.model('User', UserSchema);
