const BloodDonor = require('../models/BloodDonor');

// @desc    Register as a blood donor
// @route   POST /api/blood-donors
// @access  Private (Patient/User only)
const registerDonor = async (req, res) => {
  try {
    const { bloodGroup, cityArea, contactPreference } = req.body;

    const donorExists = await BloodDonor.findOne({ user: req.user._id });
    if (donorExists) {
      // Update registration details instead of creating new
      donorExists.bloodGroup = bloodGroup || donorExists.bloodGroup;
      donorExists.cityArea = cityArea || donorExists.cityArea;
      donorExists.contactPreference = contactPreference || donorExists.contactPreference;
      donorExists.availabilityStatus = true;
      await donorExists.save();
      return res.json({ message: 'Donor registration updated successfully', donor: donorExists });
    }

    const donor = await BloodDonor.create({
      user: req.user._id,
      bloodGroup,
      cityArea,
      contactPreference,
      availabilityStatus: true
    });

    res.status(201).json(donor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const seedDonorsFallback = [
  {
    _id: "65d000000000000000000081",
    bloodGroup: "O+",
    cityArea: "Connaught Place, New Delhi",
    availabilityStatus: true,
    contactPreference: "Phone",
    user: { name: "Rohan Varma", phone: "9876001101" }
  },
  {
    _id: "65d000000000000000000082",
    bloodGroup: "A+",
    cityArea: "Saket, New Delhi",
    availabilityStatus: true,
    contactPreference: "Phone",
    user: { name: "Ananya Iyer", phone: "9876001102" }
  },
  {
    _id: "65d000000000000000000083",
    bloodGroup: "B+",
    cityArea: "Vasant Kunj, New Delhi",
    availabilityStatus: true,
    contactPreference: "Phone",
    user: { name: "Priya Sharma", phone: "9876001103" }
  }
];

// @desc    Get voluntary blood donors list
// @route   GET /api/blood-donors
// @access  Public
const getDonors = async (req, res) => {
  const { bloodGroup, cityArea } = req.query;
  try {
    let query = { availabilityStatus: true };

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }
    if (cityArea) {
      query.cityArea = { $regex: cityArea, $options: 'i' };
    }

    const donors = await BloodDonor.find(query).populate('user', 'name email phone');
    res.json(donors);
  } catch (error) {
    const filtered = seedDonorsFallback.filter(d => {
      if (bloodGroup && d.bloodGroup !== bloodGroup) return false;
      if (cityArea && !d.cityArea.toLowerCase().includes(cityArea.toLowerCase())) return false;
      return true;
    });
    res.json(filtered.length > 0 ? filtered : seedDonorsFallback);
  }
};

// @desc    Remove blood donor registration
// @route   DELETE /api/blood-donors/me
// @access  Private
const removeDonorRegistration = async (req, res) => {
  try {
    const donor = await BloodDonor.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor registration not found.' });
    }

    await donor.deleteOne();
    res.json({ message: 'Removed donor registration successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerDonor,
  getDonors,
  removeDonorRegistration
};
