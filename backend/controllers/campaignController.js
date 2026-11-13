const HealthCampaign = require('../models/HealthCampaign');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

// @desc    Create a new health campaign drive
// @route   POST /api/campaigns
// @access  Private (Hospital / Admin)
const createCampaign = async (req, res) => {
  try {
    const { title, description, type, date, time, venue, organizer, status } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Campaign title is required.' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Campaign date is required.' });
    }
    if (!venue || typeof venue !== 'string' || venue.trim().length === 0) {
      return res.status(400).json({ message: 'Campaign venue is required.' });
    }

    const userId = req.user._id || req.user.id;
    let hospitalDoc = await Hospital.findOne({ user: userId });

    let campaignOrganizer = organizer ? organizer.trim() : '';
    if (!campaignOrganizer) {
      if (hospitalDoc && hospitalDoc.name) {
        campaignOrganizer = hospitalDoc.name;
      } else if (req.user && req.user.name) {
        campaignOrganizer = req.user.name;
      } else {
        campaignOrganizer = 'SwasthyaSetu Healthcare Network';
      }
    }

    const campaign = await HealthCampaign.create({
      hospital: hospitalDoc ? hospitalDoc._id : null,
      organizer: campaignOrganizer,
      title: title.trim(),
      description: description ? description.trim() : 'Public health initiative.',
      type: type || 'awareness',
      date,
      time: time || '09:00 AM - 05:00 PM',
      venue: venue.trim(),
      status: status || 'active'
    });

    res.status(201).json({ message: 'Campaign drive published successfully', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all public health campaigns
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));

    let query = {};
    if (type && type !== 'all') {
      query.type = type;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const campaigns = await HealthCampaign.find(query)
      .populate('hospital', 'name contactPhone address emergencyPhone')
      .sort({ date: 1 })
      .skip(skip)
      .limit(Math.min(100, parseInt(limit)));

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Database error querying campaigns' });
  }
};

// @desc    Register a patient user for a campaign drive
// @route   POST /api/campaigns/:id/register
// @access  Private (Patient / User)
const registerForCampaign = async (req, res) => {
  try {
    const campaign = await HealthCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const userId = req.user._id || req.user.id;
    const alreadyRegistered = (campaign.registeredUsers || []).some(
      u => String(u) === String(userId)
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'You are already registered for this campaign.' });
    }

    campaign.registeredUsers = campaign.registeredUsers || [];
    campaign.registeredUsers.push(userId);
    await campaign.save();

    res.json({ message: 'Registered for campaign successfully', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  registerForCampaign
};
