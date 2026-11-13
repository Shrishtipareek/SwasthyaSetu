const express = require('express');
const router = express.Router();
const {
  registerDonor,
  getMyDonorProfile,
  updateMyDonorProfile,
  getDonors,
  removeDonorRegistration,
} = require('../controllers/bloodDonorController');
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('patient'), registerDonor)
  // Public, but contact details are only unmasked for logged-in users.
  .get(optionalProtect, getDonors);

router.route('/me')
  .get(protect, getMyDonorProfile)
  .put(protect, updateMyDonorProfile)
  .delete(protect, removeDonorRegistration);

module.exports = router;
