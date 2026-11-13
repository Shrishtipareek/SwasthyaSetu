const express = require('express');
const router = express.Router();
const {
  getHospitals,
  getConnectedHospitals,
  getPublicStats,
  getHospitalById,
  updateResources,
  getHospitalDashboardStats,
  getNearbyRealHospitals
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getHospitals);
router.get('/stats', getPublicStats);
router.get('/connected', getConnectedHospitals);
router.get('/nearby-real', getNearbyRealHospitals);
router.get('/dashboard/stats', protect, authorize('hospital'), getHospitalDashboardStats);
router.put('/resources', protect, authorize('hospital'), updateResources);
// Keep the parameterised route last so it cannot shadow the fixed paths above.
router.get('/:id', getHospitalById);

module.exports = router;
