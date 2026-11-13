const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { getJwtSecret } = require('../config/env');
const { sendError, missingFields, isValidLocation, normalizeLocation, normalizeBloodGroup } = require('../utils/http');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const validateCredentials = (email, password) => {
  if (!EMAIL_REGEX.test(email)) return 'Please provide a valid email address.';
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  return null;
};

const MEDICAL_INFO_FIELDS = [
  'dob',
  'gender',
  'bloodGroup',
  'allergies',
  'chronicConditions',
  'emergencyContactName',
  'emergencyContactPhone',
  'emergencyContactRelation',
];

const sanitizeMedicalInfo = (info) => {
  if (!info || typeof info !== 'object') return undefined;
  const clean = {};
  MEDICAL_INFO_FIELDS.forEach((field) => {
    if (info[field] !== undefined) clean[field] = info[field];
  });
  if (clean.bloodGroup !== undefined && clean.bloodGroup !== '' && clean.bloodGroup !== null) {
    clean.bloodGroup = normalizeBloodGroup(clean.bloodGroup) || clean.bloodGroup;
  }
  ['allergies', 'chronicConditions'].forEach((field) => {
    if (typeof clean[field] === 'string') {
      clean[field] = clean[field].split(',').map((s) => s.trim()).filter(Boolean);
    }
  });
  return clean;
};

// Fields a hospital account may edit on its own profile. verifiedStatus, user,
// licenseNumber, inventory, etc. must NOT be editable through the profile endpoint.
const EDITABLE_HOSPITAL_FIELDS = [
  'name',
  'address',
  'emergencyPhone',
  'contactPhone',
  'website',
  'hospitalType',
  'facilities',
  'departments',
  'operatingHours',
  'location',
];

const buildUserResponse = (user, extra = {}) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  location: user.location,
  medicalInfo: user.medicalInfo,
  ...extra,
});

// @desc    Register a new user (Patient)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, password, phone, location, medicalInfo } = req.body;
    const email = normalizeEmail(req.body.email);

    const missing = missingFields({ ...req.body, email }, ['name', 'email', 'password', 'phone']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    const credError = validateCredentials(email, password);
    if (credError) return res.status(400).json({ message: credError });

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // SECURITY: public registration can only create patient accounts. Previously any
    // caller could send { role: 'admin' } and grant themselves admin rights.
    const user = await User.create({
      name: String(name).trim(),
      email,
      password,
      role: 'patient',
      phone,
      location: isValidLocation(location) ? normalizeLocation(location) : { lat: 28.6139, lng: 77.209 },
      medicalInfo: sanitizeMedicalInfo(medicalInfo),
    });

    res.status(201).json(buildUserResponse(user, { token: generateToken(user._id), hospitalProfile: null }));
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Register a new Hospital (creates User + Hospital profile)
// @route   POST /api/auth/register-hospital
// @access  Public
const registerHospital = async (req, res) => {
  let createdUser = null;
  try {
    const {
      name,
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
      location,
    } = req.body;
    const email = normalizeEmail(req.body.email);

    const missing = missingFields({ ...req.body, email }, [
      'name',
      'email',
      'password',
      'phone',
      'emergencyPhone',
      'licenseNumber',
      'address',
    ]);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    const credError = validateCredentials(email, password);
    if (credError) return res.status(400).json({ message: credError });

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const licenseExists = await Hospital.findOne({ licenseNumber: String(licenseNumber).trim() });
    if (licenseExists) {
      return res.status(400).json({ message: 'A hospital with this license number is already registered' });
    }

    const hospitalLocation = isValidLocation(location) ? normalizeLocation(location) : { lat: 28.6139, lng: 77.209 };

    // Create User first
    createdUser = await User.create({
      name,
      email,
      password,
      role: 'hospital',
      phone,
      location: hospitalLocation,
    });

    // Create Hospital Profile
    const hospital = await Hospital.create({
      user: createdUser._id,
      name,
      licenseNumber: String(licenseNumber).trim(),
      address,
      emergencyPhone,
      contactPhone: phone,
      website,
      hospitalType,
      facilities: Array.isArray(facilities) && facilities.length ? facilities : undefined,
      departments: Array.isArray(departments) && departments.length ? departments : undefined,
      operatingHours: operatingHours || '24/7',
      location: hospitalLocation,
      verifiedStatus: 'pending',
    });

    res.status(201).json(
      buildUserResponse(createdUser, {
        token: generateToken(createdUser._id),
        hospitalProfile: hospital,
      })
    );
  } catch (error) {
    // Roll back the orphan user account if the hospital profile could not be created,
    // otherwise the email is "taken" but the account is unusable.
    if (createdUser) {
      await User.deleteOne({ _id: createdUser._id }).catch(() => {});
    }
    sendError(res, error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
      let hospitalProfile = null;
      if (user.role === 'hospital') {
        hospitalProfile = await Hospital.findOne({ user: user._id });
      }

      res.json(buildUserResponse(user, { token: generateToken(user._id), hospitalProfile }));
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let hospitalProfile = null;
      if (user.role === 'hospital') {
        hospitalProfile = await Hospital.findOne({ user: user._id });
      }

      res.json(buildUserResponse(user, { hospitalProfile }));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (typeof req.body.name === 'string' && req.body.name.trim()) user.name = req.body.name.trim();
    if (typeof req.body.phone === 'string' && req.body.phone.trim()) user.phone = req.body.phone.trim();
    if (req.body.location !== undefined) {
      if (!isValidLocation(req.body.location)) {
        return res.status(400).json({ message: 'Location must contain valid numeric lat and lng values.' });
      }
      user.location = normalizeLocation(req.body.location);
    }

    if (user.role === 'patient' && req.body.medicalInfo) {
      // Merge with the existing values. Spreading the Mongoose sub-document directly
      // (the previous code) copied Mongoose internals instead of the stored fields.
      const current = user.medicalInfo ? user.medicalInfo.toObject?.() || { ...user.medicalInfo } : {};
      user.medicalInfo = { ...current, ...sanitizeMedicalInfo(req.body.medicalInfo) };
    }

    if (req.body.password) {
      if (typeof req.body.password !== 'string' || req.body.password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    let hospitalProfile = null;
    if (user.role === 'hospital') {
      hospitalProfile = await Hospital.findOne({ user: user._id });
      if (hospitalProfile && req.body.hospitalProfile && typeof req.body.hospitalProfile === 'object') {
        EDITABLE_HOSPITAL_FIELDS.forEach((field) => {
          const value = req.body.hospitalProfile[field];
          if (value === undefined) return;
          if (field === 'location') {
            if (isValidLocation(value)) hospitalProfile.location = normalizeLocation(value);
            return;
          }
          hospitalProfile[field] = value;
        });
        await hospitalProfile.save();
      }
    }

    res.json(buildUserResponse(updatedUser, { token: generateToken(updatedUser._id), hospitalProfile }));
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  registerUser,
  registerHospital,
  authUser,
  getUserProfile,
  updateUserProfile,
};
