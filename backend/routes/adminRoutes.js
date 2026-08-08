const express = require('express');
const router = express.Router();
const { getAllHospitalsForAdmin, verifyHospital, getAdminSystemStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/hospitals', getAllHospitalsForAdmin);
router.put('/hospitals/:id/verify', verifyHospital);
router.get('/stats', getAdminSystemStats);

module.exports = router;
