const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'swasthya_setu_secure_jwt_secret_key_9f8d7c6b5a4e3d2c1b0a';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, location, medicalInfo } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, password, and phone number are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

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
      location: location || { lat: 28.6139, lng: 77.2090 },
      medicalInfo
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

    if (!name || !email || !password || !phone || !licenseNumber || !address) {
      return res.status(400).json({ message: 'Hospital name, email, password, phone, license number, and address are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'hospital',
      phone
    });

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

const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');

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

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

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
        if (typeof req.body.password !== 'string' || req.body.password.length < 6) {
          return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }
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
