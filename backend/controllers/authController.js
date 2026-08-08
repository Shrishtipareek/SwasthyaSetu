const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'SwasthyaSetu_super_secret_jwt_key', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Patient or Admin)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
      phone,
      location: location || { lat: 28.6139, lng: 77.2090 }
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new Hospital (creates User + Hospital profile)
// @route   POST /api/auth/register-hospital
// @access  Public
const registerHospital = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      emergencyPhone,
      licenseNumber,
      address,
      website,
      hospitalType,
      facilities,
      departments,
      operatingHours,
      location
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create User first
    const user = await User.create({
      name,
      email,
      password,
      role: 'hospital',
      phone
    });

    // Create Hospital Profile
    const hospital = await Hospital.create({
      user: user._id,
      name,
      licenseNumber,
      address,
      emergencyPhone,
      contactPhone: phone,
      website,
      hospitalType,
      facilities: facilities || ['Emergency Room', 'Pharmacy', 'Diagnostic Lab'],
      departments: departments || ['General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics'],
      operatingHours: operatingHours || '24/7',
      location: location || { lat: 28.6139, lng: 77.2090 },
      verifiedStatus: 'pending'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      hospitalProfile: hospital
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      let hospitalProfile = null;
      if (user.role === 'hospital') {
        hospitalProfile = await Hospital.findOne({ user: user._id });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        medicalInfo: user.medicalInfo,
        token: generateToken(user._id),
        hospitalProfile
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let hospitalProfile = null;
      if (user.role === 'hospital') {
        hospitalProfile = await Hospital.findOne({ user: user._id });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        medicalInfo: user.medicalInfo,
        hospitalProfile
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      if (req.body.location) {
        user.location = req.body.location;
      }

      if (user.role === 'patient' && req.body.medicalInfo) {
        user.medicalInfo = {
          ...user.medicalInfo,
          ...req.body.medicalInfo
        };
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      let hospitalProfile = null;
      if (user.role === 'hospital') {
        hospitalProfile = await Hospital.findOne({ user: user._id });
        if (hospitalProfile && req.body.hospitalProfile) {
          Object.assign(hospitalProfile, req.body.hospitalProfile);
          await hospitalProfile.save();
        }
      }

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        location: updatedUser.location,
        medicalInfo: updatedUser.medicalInfo,
        token: generateToken(updatedUser._id),
        hospitalProfile
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  registerHospital,
  authUser,
  getUserProfile,
  updateUserProfile,
};
