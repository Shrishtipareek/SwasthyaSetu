const express = require('express');
const router = express.Router();
const { getHistory, sendMessageToAI } = require('../controllers/aiController');
const { optionalProtect } = require('../middleware/authMiddleware');

// Guests may chat. An expired token in localStorage used to make every chat
// request fail with 401; optionalProtect falls back to guest mode instead.
router.post('/chat', optionalProtect, sendMessageToAI);
router.get('/history', optionalProtect, getHistory);

module.exports = router;
