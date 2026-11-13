const HealthCampaign = require('../models/HealthCampaign');
const Hospital = require('../models/Hospital');
const { getFallbackCampaigns } = require('../utils/fallbackData');
const {
  sendError,
  isDbConnected,
  isValidObjectId,
  isValidISODate,
  todayISO,
  missingFields,
  parsePagination,
} = require('../utils/http');

const CAMPAIGN_TYPES = HealthCampaign.schema.path('type').enumValues;
const CAMPAIGN_STATUSES = HealthCampaign.schema.path('status').enumValues;
const DEFAULT_ORGANIZER = 'SwasthyaSetu Healthcare Network';

const cleanText = (value, max = 2000) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : '');

// @desc    Create a new health campaign / drive
// @route   POST /api/campaigns
// @access  Private (verified Hospital, or Admin)
const createCampaign = async (req, res) => {
  try {
    const { title, description, type, date, time, venue, organizer, status } = req.body;

    const missing = missingFields(req.body, ['title', 'date', 'venue']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }
    if (type !== undefined && type !== '' && !CAMPAIGN_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${CAMPAIGN_TYPES.join(', ')}` });
    }
    if (status !== undefined && status !== '' && !CAMPAIGN_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${CAMPAIGN_STATUSES.join(', ')}` });
    }
    if (!isValidISODate(date)) {
      return res.status(400).json({ message: 'date must be a valid date in YYYY-MM-DD format.' });
    }
    if (date < todayISO()) {
      return res.status(400).json({ message: 'Campaign date cannot be in the past.' });
    }

    // Hospitals publish under their (verified) profile; administrators can publish
    // network-wide drives that are not tied to a hospital.
    let hospital = null;
    if (req.user.role === 'hospital') {
      hospital = await Hospital.findOne({ user: req.user._id });
      if (!hospital) {
        return res.status(404).json({ message: 'Hospital profile not found' });
      }
      if (hospital.verifiedStatus !== 'verified') {
        return res.status(403).json({ message: 'Only verified hospitals can publish health campaigns.' });
      }
    }

    const campaign = await HealthCampaign.create({
      hospital: hospital ? hospital._id : null,
      organizer: cleanText(organizer, 200) || (hospital && hospital.name) || req.user.name || DEFAULT_ORGANIZER,
      title: cleanText(title, 200),
      description: cleanText(description) || 'Public health initiative.',
      type: type || undefined,
      date,
      time: cleanText(time, 100) || '09:00 AM - 05:00 PM',
      venue: cleanText(venue, 300),
      status: status || undefined,
    });

    res.status(201).json(campaign);
  } catch (error) {
    sendError(res, error);
  }
};

// Demo data (utils/fallbackData) served only while the database is unreachable.
const getCampaignsFallback = getFallbackCampaigns;

// @desc    Get campaigns. Upcoming only by default; ?includePast=true (or
//          ?status=completed) includes past drives. Also ?type=, ?status=, ?page=, ?limit=
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = async (req, res) => {
  try {
    const { type, status, includePast } = req.query;
    const typeFilter = type && type !== 'all' ? type : null;
    const statusFilter = status && status !== 'all' ? status : null;

    if (typeFilter && !CAMPAIGN_TYPES.includes(typeFilter)) {
      return res.status(400).json({ message: `type must be one of: ${CAMPAIGN_TYPES.join(', ')}` });
    }
    if (statusFilter && !CAMPAIGN_STATUSES.includes(statusFilter)) {
      return res.status(400).json({ message: `status must be one of: ${CAMPAIGN_STATUSES.join(', ')}` });
    }

    if (!isDbConnected()) {
      res.set('X-Data-Source', 'fallback');
      return res.json(
        getCampaignsFallback().filter((c) => (!typeFilter || c.type === typeFilter) && (!statusFilter || c.status === statusFilter))
      );
    }

    const query = {};
    if (includePast !== 'true' && statusFilter !== 'completed') query.date = { $gte: todayISO() };
    if (typeFilter) query.type = typeFilter;
    if (statusFilter) query.status = statusFilter;
    const { skip, limit } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });

    const campaigns = await HealthCampaign.find(query)
      .populate('hospital', 'name contactPhone address emergencyPhone')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);
    res.json(campaigns);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Register a patient for a campaign
// @route   POST /api/campaigns/:id/register
// @access  Private (Patient only)
const registerForCampaign = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid campaign id' });
    }

    const campaign = await HealthCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.date < todayISO() || campaign.status === 'completed') {
      return res.status(400).json({ message: 'This campaign has already taken place.' });
    }

    // $addToSet + filter makes double registration impossible even for concurrent clicks.
    const updated = await HealthCampaign.findOneAndUpdate(
      { _id: campaign._id, registeredUsers: { $ne: req.user._id } },
      { $addToSet: { registeredUsers: req.user._id } },
      { new: true }
    );
    if (!updated) {
      return res.status(400).json({ message: 'You are already registered for this campaign.' });
    }

    res.json({ message: 'Registered for campaign successfully', campaign: updated });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  registerForCampaign,
};
