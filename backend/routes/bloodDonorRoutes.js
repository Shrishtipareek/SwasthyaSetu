const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  registerDonor,
  getMyDonorProfile,
  updateMyDonorProfile,
  removeDonorRegistration,
  getDonors
} = require('../controllers/bloodDonorController');
const { protect } = require('../middleware/authMiddleware');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'swasthya_setu_secure_jwt_secret_key_9f8d7c6b5a4e3d2c1b0a';
      req.user = jwt.verify(token, secret);
    } catch (e) {
      // Proceed without user
    }
  }
  next();
};

router.route('/')
  .post(protect, registerDonor)
  .get(optionalAuth, getDonors);

router.route('/me')
  .get(protect, getMyDonorProfile)
  .put(protect, updateMyDonorProfile)
  .delete(protect, removeDonorRegistration);

module.exports = router;
