const AIConversation = require('../models/AIConversation');
const { getAIResponse } = require('../utils/gemini');

const getHistory = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    
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

const sendMessageToAI = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message exceeds maximum length of 2000 characters.' });
    }

    const cleanMessage = message.trim();

    let conversation = null;
    let history = [];
    if (userId) {
      conversation = await AIConversation.findOne({ user: userId });
      if (!conversation) {
        conversation = await AIConversation.create({ user: userId, messages: [] });
      }
      history = conversation.messages.slice(-10); 
    }

    const aiResult = await getAIResponse(cleanMessage, history);

    if (userId && conversation) {
      conversation.messages.push({ sender: 'user', text: cleanMessage });
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
