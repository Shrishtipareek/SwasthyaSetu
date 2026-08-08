const express = require('express');
const router = express.Router();
const { bookAppointment, getAppointments, cancelAppointment } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, bookAppointment)
  .get(protect, getAppointments);

router.put('/:id/cancel', protect, cancelAppointment);

module.exports = router;
