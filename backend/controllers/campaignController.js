const HealthCampaign = require('../models/HealthCampaign');
const Hospital = require('../models/Hospital');

// @desc    Create a new health campaign / drive
// @route   POST /api/campaigns
// @access  Private (Hospital admin only)
const createCampaign = async (req, res) => {
  try {
    const { title, description, type, date, time, venue } = req.body;

    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const campaign = await HealthCampaign.create({
      hospital: hospital._id,
      title,
      description,
      type,
      date,
      time,
      venue
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Public
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await HealthCampaign.find()
      .populate('hospital', 'name contactPhone address')
      .sort({ date: 1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a patient/user for a campaign
// @route   POST /api/campaigns/:id/register
// @access  Private (Patient/User only)
const registerForCampaign = async (req, res) => {
  try {
    const campaign = await HealthCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.registeredUsers.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already registered for this campaign.' });
    }

    campaign.registeredUsers.push(req.user._id);
    await campaign.save();

    res.json({ message: 'Registered successfully', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  registerForCampaign
};
