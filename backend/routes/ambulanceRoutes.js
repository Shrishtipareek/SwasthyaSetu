const express = require('express');
const router = express.Router();
const { registerAmbulance, getAmbulances, updateAmbulance } = require('../controllers/ambulanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('hospital'), registerAmbulance)
  .get(getAmbulances);

router.put('/:id', protect, authorize('hospital'), updateAmbulance);

module.exports = router;
