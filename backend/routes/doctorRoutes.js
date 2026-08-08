const express = require('express');
const router = express.Router();
const { getDoctors, addDoctor, removeDoctor } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getDoctors)
  .post(protect, authorize('hospital'), addDoctor);

router.delete('/:id', protect, authorize('hospital'), removeDoctor);

module.exports = router;
