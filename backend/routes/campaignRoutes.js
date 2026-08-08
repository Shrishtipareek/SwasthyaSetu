const express = require('express');
const router = express.Router();
const { createCampaign, getCampaigns, registerForCampaign } = require('../controllers/campaignController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('hospital'), createCampaign)
  .get(getCampaigns);

router.post('/:id/register', protect, registerForCampaign);

module.exports = router;
