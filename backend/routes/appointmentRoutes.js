const express = require('express');
const router = express.Router();
const { bookAppointment, getAppointments, cancelAppointment } = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  // Only patients book appointments (a hospital/admin booking created
  // appointments with the staff account as the "patient").
  .post(protect, authorize('patient'), bookAppointment)
  .get(protect, getAppointments);

router.put('/:id/cancel', protect, cancelAppointment);

module.exports = router;
