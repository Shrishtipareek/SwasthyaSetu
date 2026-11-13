const express = require('express');
const router = express.Router();
const {
  getHospitals,
  getPublicStats,
  getConnectedHospitals,
  getHospitalById,
  updateResources,
  getHospitalDashboardStats,
  getNearbyRealHospitals
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getHospitals);
router.get('/stats', getPublicStats);
router.get('/connected', getConnectedHospitals);
router.get('/dashboard/stats', protect, authorize('hospital'), getHospitalDashboardStats);
router.get('/nearby-real', getNearbyRealHospitals);
router.get('/:id', getHospitalById);
router.put('/resources', protect, authorize('hospital'), updateResources);

module.exports = router;
