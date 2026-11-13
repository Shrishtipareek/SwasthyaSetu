const BloodDonor = require('../models/BloodDonor');
const User = require('../models/User');

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Helper to normalize blood groups from query strings where '+' becomes ' '
const normalizeBloodGroup = (bg) => {
  if (!bg || typeof bg !== 'string') return null;
  const cleaned = bg.trim().replace(/\s+/g, '+');
  return VALID_BLOOD_GROUPS.includes(cleaned) ? cleaned : null;
};

const maskPhone = (phone) => {
  if (!phone) return 'Confidential';
  const clean = String(phone).trim();
  if (clean.length <= 4) return '****';
  return clean.slice(0, 3) + '****' + clean.slice(-2);
};

// @desc    Register as a voluntary blood donor or update existing profile
// @route   POST /api/blood-donors
// @access  Private
const registerDonor = async (req, res) => {
  try {
    const { bloodGroup, cityArea, contactPreference, availabilityStatus } = req.body;
    const normalizedGroup = normalizeBloodGroup(bloodGroup);

    if (!normalizedGroup) {
      return res.status(400).json({
        message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`
      });
    }

    if (!cityArea || typeof cityArea !== 'string' || cityArea.trim().length === 0) {
      return res.status(400).json({ message: 'City or area location is required.' });
    }

    const userId = req.user._id || req.user.id;
    let donor = await BloodDonor.findOne({ user: userId });

    if (donor) {
      donor.bloodGroup = normalizedGroup;
      donor.cityArea = cityArea.trim();
      donor.contactPreference = contactPreference || donor.contactPreference;
      donor.availabilityStatus = availabilityStatus !== undefined ? availabilityStatus : true;
      await donor.save();
      return res.json({ message: 'Donor registration updated successfully', donor });
    }

    donor = await BloodDonor.create({
      user: userId,
      bloodGroup: normalizedGroup,
      cityArea: cityArea.trim(),
      contactPreference: contactPreference || 'Phone',
      availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : true
    });

    res.status(201).json({ message: 'Registered as voluntary blood donor successfully', donor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's donor registration status & profile
// @route   GET /api/blood-donors/me
// @access  Private
const getMyDonorProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const donor = await BloodDonor.findOne({ user: userId }).populate('user', 'name email phone');
    if (!donor) {
      return res.json({ isRegistered: false, donor: null });
    }
    res.json({ isRegistered: true, donor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update current user's donor profile
// @route   PUT /api/blood-donors/me
// @access  Private
const updateMyDonorProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const donor = await BloodDonor.findOne({ user: userId });
    if (!donor) {
      return res.status(404).json({ message: 'Donor registration not found.' });
    }

    const { bloodGroup, cityArea, contactPreference, availabilityStatus } = req.body;
    if (bloodGroup) {
      const normalizedGroup = normalizeBloodGroup(bloodGroup);
      if (!normalizedGroup) {
        return res.status(400).json({
          message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`
        });
      }
      donor.bloodGroup = normalizedGroup;
    }

    if (cityArea && typeof cityArea === 'string' && cityArea.trim().length > 0) {
      donor.cityArea = cityArea.trim();
    }

    if (contactPreference) {
      donor.contactPreference = contactPreference;
    }

    if (availabilityStatus !== undefined) {
      donor.availabilityStatus = Boolean(availabilityStatus);
    }

    await donor.save();
    res.json({ message: 'Donor profile updated successfully', donor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/Remove current user's donor registration
// @route   DELETE /api/blood-donors/me
// @access  Private
const removeDonorRegistration = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const donor = await BloodDonor.findOne({ user: userId });
    if (!donor) {
      return res.status(404).json({ message: 'Donor registration not found.' });
    }

    await donor.deleteOne();
    res.json({ message: 'Removed voluntary blood donor registration successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search voluntary blood donors with filters
// @route   GET /api/blood-donors
// @access  Public (contact details masked for guests)
const getDonors = async (req, res) => {
  const { bloodGroup, cityArea, page = 1, limit = 50 } = req.query;
  const isAuthenticated = !!req.user;

  try {
    let query = { availabilityStatus: true };

    if (bloodGroup && bloodGroup !== 'all' && bloodGroup.trim().length > 0) {
      const normalized = normalizeBloodGroup(bloodGroup);
      if (normalized) {
        query.bloodGroup = normalized;
      }
    }

    if (cityArea && typeof cityArea === 'string' && cityArea.trim().length > 0) {
      query.cityArea = { $regex: cityArea.trim(), $options: 'i' };
    }

    const donors = await BloodDonor.find(query)
      .populate('user', 'name email phone')
      .sort({ updatedAt: -1 })
      .skip((Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit)))
      .limit(Math.min(100, parseInt(limit)));

    // Protect donor personal contact information if guest
    const sanitized = donors.map(d => {
      const doc = d.toObject ? d.toObject() : { ...d };
      if (!isAuthenticated && doc.user) {
        doc.user = {
          _id: doc.user._id,
          name: doc.user.name,
          phone: maskPhone(doc.user.phone),
          isProtected: true
        };
      }
      return doc;
    });

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Database error querying blood donors' });
  }
};

module.exports = {
  registerDonor,
  getMyDonorProfile,
  updateMyDonorProfile,
  removeDonorRegistration,
  getDonors
};
