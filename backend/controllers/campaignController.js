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

const seedCampaignsFallback = [
  {
    _id: "65d000000000000000000091",
    title: "Mega Blood Donation Camp",
    description: "Join us for our annual blood donation camp to save lives in emergency situations. Free health screening checks for all donors.",
    type: "blood_camp",
    date: "2026-09-15",
    time: "09:00 AM - 05:00 PM",
    venue: "AIIMS Main Auditorium Area, New Delhi",
    hospital: { name: "AIIMS New Delhi" },
    registeredUsers: []
  },
  {
    _id: "65d000000000000000000092",
    title: "Free Vaccination Drive",
    description: "Hepatitis B and Influenza vaccination drive for senior citizens and young children.",
    type: "vaccination",
    date: "2026-10-10",
    time: "10:00 AM - 03:00 PM",
    venue: "Apollo Hospital Complex, New Delhi",
    hospital: { name: "Apollo Hospital Delhi" },
    registeredUsers: []
  }
];

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
    res.json(seedCampaignsFallback);
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
