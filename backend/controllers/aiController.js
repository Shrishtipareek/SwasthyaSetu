const AIConversation = require('../models/AIConversation');
const { getAIResponse } = require('../utils/gemini');

// @desc    Get chat history
// @route   GET /api/ai/history
// @access  Public (Optional auth)
const getHistory = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    
    // For guest users, we would normally use a session ID. For simplicity,
    // if no user, return empty array (or let them maintain local state)
    if (!userId) {
      return res.json([]);
    }

    let conversation = await AIConversation.findOne({ user: userId });
    if (!conversation) {
      conversation = await AIConversation.create({ user: userId, messages: [] });
    }

    res.json(conversation.messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message to CareAI and get a response
// @route   POST /api/ai/chat
// @access  Public (Optional auth)
const sendMessageToAI = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    // Get previous chat history to provide context to Gemini
    let conversation = null;
    let history = [];
    if (userId) {
      conversation = await AIConversation.findOne({ user: userId });
      if (!conversation) {
        conversation = await AIConversation.create({ user: userId, messages: [] });
      }
      history = conversation.messages.slice(-10); // last 10 messages
    }

    // Fetch response from Gemini / local rules engine
    const aiResult = await getAIResponse(message, history);

    // Save history if user is logged in
    if (userId && conversation) {
      conversation.messages.push({ sender: 'user', text: message });
      conversation.messages.push({ sender: 'ai', text: aiResult.reply });
      await conversation.save();
    }

    res.json({
      reply: aiResult.reply,
      isEmergency: aiResult.isEmergency || false,
      suggestAppointment: aiResult.suggestAppointment || false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHistory,
  sendMessageToAI
};
