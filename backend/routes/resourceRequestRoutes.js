const express = require('express');
const router = express.Router();
const {
  createResourceRequest,
  getResourceRequests,
  respondToRequest,
  updateTransferStatus
} = require('../controllers/resourceRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('hospital'), createResourceRequest)
  .get(protect, authorize('hospital'), getResourceRequests);

router.put('/:id/respond', protect, authorize('hospital'), respondToRequest);
router.put('/:id/status', protect, authorize('hospital'), updateTransferStatus);

module.exports = router;
