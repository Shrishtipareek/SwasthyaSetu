const express = require('express');
const router = express.Router();
const { initiateEmergency, updateEmergencyStatus, getHospitalEmergencies } = require('../controllers/emergencyController');
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');

// Guests and patients can raise an emergency. An invalid or expired token must
// never block an SOS request, so it is treated as a guest request.
router.post('/', optionalProtect, initiateEmergency);

router.get('/hospital', protect, authorize('hospital'), getHospitalEmergencies);
router.put('/:id', protect, authorize('hospital'), updateEmergencyStatus);

module.exports = router;
