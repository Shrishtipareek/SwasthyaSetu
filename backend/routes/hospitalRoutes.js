const express = require('express');
const router = express.Router();
const {
  getHospitals,
  getPublicStats,
  getHospitalById,
  updateResources,
  getHospitalDashboardStats
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getHospitals);
router.get('/stats', getPublicStats);
router.get('/dashboard/stats', protect, authorize('hospital'), getHospitalDashboardStats);
router.get('/:id', getHospitalById);
router.put('/resources', protect, authorize('hospital'), updateResources);

module.exports = router;
