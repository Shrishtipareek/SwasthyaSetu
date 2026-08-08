const express = require('express');
const router = express.Router();
const { registerDonor, getDonors, removeDonorRegistration } = require('../controllers/bloodDonorController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, registerDonor)
  .get(getDonors);

router.delete('/me', protect, removeDonorRegistration);

module.exports = router;
