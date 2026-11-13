const BloodDonor = require('../models/BloodDonor');
const User = require('../models/User');
const { fallbackDonors } = require('../utils/fallbackData');
const {
  sendError,
  isDbConnected,
  escapeRegex,
  normalizeBloodGroup,
  maskPhone,
  parsePagination,
} = require('../utils/http');

const CONTACT_PREFERENCES = BloodDonor.schema.path('contactPreference').enumValues;

/**
 * Validate the donor fields of a request body. `partial` allows omitting fields
 * (PUT /me); otherwise bloodGroup and cityArea are required.
 */
const parseDonorInput = (body, { partial = false, fallbackBloodGroup } = {}) => {
  const update = {};

  if (body.bloodGroup !== undefined && body.bloodGroup !== '') {
    const group = normalizeBloodGroup(body.bloodGroup);
    if (!group) return { error: 'bloodGroup must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-' };
    update.bloodGroup = group;
  } else if (!partial) {
    const group = normalizeBloodGroup(fallbackBloodGroup);
    if (!group) return { error: 'bloodGroup is required (A+, A-, B+, B-, O+, O-, AB+, AB-).' };
    update.bloodGroup = group;
  }

  if (body.cityArea !== undefined) {
    if (typeof body.cityArea !== 'string' || !body.cityArea.trim()) return { error: 'cityArea cannot be empty.' };
    update.cityArea = body.cityArea.trim();
  } else if (!partial) {
    return { error: 'cityArea is required.' };
  }

  if (body.contactPreference !== undefined && body.contactPreference !== '') {
    if (!CONTACT_PREFERENCES.includes(body.contactPreference)) {
      return { error: `contactPreference must be one of: ${CONTACT_PREFERENCES.join(', ')}` };
    }
    update.contactPreference = body.contactPreference;
  }

  if (body.availabilityStatus !== undefined) {
    if (typeof body.availabilityStatus !== 'boolean') return { error: 'availabilityStatus must be true or false.' };
    update.availabilityStatus = body.availabilityStatus;
  }

  if (body.lastDonationDate !== undefined && body.lastDonationDate !== null && body.lastDonationDate !== '') {
    const d = new Date(body.lastDonationDate);
    if (Number.isNaN(d.getTime()) || d > new Date()) return { error: 'lastDonationDate must be a valid date that is not in the future.' };
    update.lastDonationDate = d;
  }

  return { update };
};

// Keep the patient's medical profile in sync when it has no blood group yet.
const syncProfileBloodGroup = async (userId, bloodGroup) => {
  if (!bloodGroup) return;
  await User.updateOne(
    { _id: userId, $or: [{ 'medicalInfo.bloodGroup': { $exists: false } }, { 'medicalInfo.bloodGroup': null }, { 'medicalInfo.bloodGroup': '' }] },
    { $set: { 'medicalInfo.bloodGroup': bloodGroup } }
  );
};

// @desc    Register (or re-activate / update) as a blood donor
// @route   POST /api/blood-donors
// @access  Private (Patient only)
const registerDonor = async (req, res) => {
  try {
    const { update, error } = parseDonorInput(req.body, {
      fallbackBloodGroup: req.user.medicalInfo && req.user.medicalInfo.bloodGroup,
    });
    if (error) return res.status(400).json({ message: error });

    // Upsert: one registration per user; registering again re-activates it unless
    // the caller explicitly sends availabilityStatus: false.
    const result = await BloodDonor.findOneAndUpdate(
      { user: req.user._id },
      { $set: { ...update, availabilityStatus: update.availabilityStatus !== undefined ? update.availabilityStatus : true } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true, includeResultMetadata: true }
    );
    const donor = result.value;
    const created = !(result.lastErrorObject && result.lastErrorObject.updatedExisting);

    await syncProfileBloodGroup(req.user._id, donor.bloodGroup);

    res.status(created ? 201 : 200).json({
      message: created ? 'Registered as a voluntary blood donor' : 'Donor registration updated successfully',
      donor,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get the logged-in user's donor registration
// @route   GET /api/blood-donors/me
// @access  Private
const getMyDonorProfile = async (req, res) => {
  try {
    const donor = await BloodDonor.findOne({ user: req.user._id }).populate('user', 'name email phone');
    // `isRegistered` is what the dashboard reads; `registered` kept for API compatibility.
    res.json({ isRegistered: !!donor, registered: !!donor, donor });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Update the logged-in user's donor registration
// @route   PUT /api/blood-donors/me
// @access  Private
const updateMyDonorProfile = async (req, res) => {
  try {
    const { update, error } = parseDonorInput(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });

    const donor = await BloodDonor.findOneAndUpdate({ user: req.user._id }, { $set: update }, { new: true, runValidators: true });
    if (!donor) {
      return res.status(404).json({ message: 'Donor registration not found.' });
    }
    res.json({ message: 'Donor registration updated successfully', donor });
  } catch (error) {
    sendError(res, error);
  }
};

// Demo data (utils/fallbackData) served only while the database is unreachable.
const seedDonorsFallback = fallbackDonors;

/** Guests only see masked phone numbers and never e-mail addresses. */
const presentDonor = (donor, isAuthenticated) => {
  const user = donor.user || {};
  const showEmail = isAuthenticated && donor.contactPreference === 'Email';
  return {
    _id: donor._id,
    bloodGroup: donor.bloodGroup,
    cityArea: donor.cityArea,
    availabilityStatus: donor.availabilityStatus,
    contactPreference: donor.contactPreference,
    lastDonationDate: donor.lastDonationDate,
    user: {
      _id: user._id,
      name: user.name,
      phone: isAuthenticated ? user.phone : maskPhone(user.phone),
      ...(showEmail ? { email: user.email } : {}),
      isProtected: !isAuthenticated,
    },
    isMasked: !isAuthenticated,
  };
};

// @desc    Get voluntary blood donors list (?bloodGroup=O%2B&cityArea=saket)
// @route   GET /api/blood-donors
// @access  Public (contact details are masked for guests)
const getDonors = async (req, res) => {
  try {
    const { cityArea } = req.query;
    const isAuthenticated = !!req.user;

    let bloodGroup = null;
    const rawGroup = req.query.bloodGroup;
    if (rawGroup !== undefined && rawGroup !== '' && String(rawGroup).toLowerCase() !== 'all') {
      // Handles "O+", "O " (a raw "+" in a query string decodes to a space) and "Op".
      bloodGroup = normalizeBloodGroup(rawGroup);
      if (!bloodGroup) {
        return res.status(400).json({ message: `Invalid blood group: ${rawGroup}` });
      }
    }
    const area = typeof cityArea === 'string' ? cityArea.trim() : '';

    if (!isDbConnected()) {
      res.set('X-Data-Source', 'fallback');
      // Only matching donors: returning everyone for an empty match showed donors
      // of the wrong blood group.
      const filtered = seedDonorsFallback.filter(
        (d) => (!bloodGroup || d.bloodGroup === bloodGroup) && (!area || d.cityArea.toLowerCase().includes(area.toLowerCase()))
      );
      return res.json(filtered.map((d) => presentDonor(d, isAuthenticated)));
    }

    const query = { availabilityStatus: true };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (area) query.cityArea = { $regex: escapeRegex(area), $options: 'i' };

    const { skip, limit } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
    const donors = await BloodDonor.find(query)
      .populate('user', 'name email phone')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    // Skip registrations whose user account no longer exists.
    res.json(donors.filter((d) => d.user).map((d) => presentDonor(d, isAuthenticated)));
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Remove blood donor registration
// @route   DELETE /api/blood-donors/me
// @access  Private
const removeDonorRegistration = async (req, res) => {
  try {
    const donor = await BloodDonor.findOneAndDelete({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor registration not found.' });
    }
    res.json({ message: 'Removed donor registration successfully.' });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  registerDonor,
  getMyDonorProfile,
  updateMyDonorProfile,
  getDonors,
  removeDonorRegistration,
};
