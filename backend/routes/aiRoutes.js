const express = require('express');
const router = express.Router();
const { getHistory, sendMessageToAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const optionalProtect = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

router.post('/chat', optionalProtect, sendMessageToAI);
router.get('/history', optionalProtect, getHistory);

module.exports = router;
