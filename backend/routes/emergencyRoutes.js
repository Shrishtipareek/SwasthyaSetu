const express = require('express');
const router = express.Router();
const { initiateEmergency, updateEmergencyStatus, getHospitalEmergencies } = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route can be accessed as guest (optional protect)
router.post('/', (req, res, next) => {
  // If authorization header is provided, run protect, otherwise proceed as guest
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, initiateEmergency);

router.get('/hospital', protect, authorize('hospital'), getHospitalEmergencies);
router.put('/:id', protect, authorize('hospital'), updateEmergencyStatus);

module.exports = router;
