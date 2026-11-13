const AIConversation = require('../models/AIConversation');
const { getAIResponse } = require('../utils/gemini');
const { sendError } = require('../utils/http');

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_CONTEXT_SIZE = 10;
const MAX_STORED_MESSAGES = 100;

// @desc    Get chat history
// @route   GET /api/ai/history
// @access  Public (Optional auth)
const getHistory = async (req, res) => {
  try {
    // Guests keep their chat locally.
    if (!req.user) {
      return res.json([]);
    }

    const conversation = await AIConversation.findOne({ user: req.user._id }).lean();
    res.json(conversation ? conversation.messages : []);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Send a message to CareAI and get a response
// @route   POST /api/ai/chat
// @access  Public (Optional auth)
const sendMessageToAI = async (req, res) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const userId = req.user ? req.user._id : null;

    if (!message) {
      return res.status(400).json({ message: 'Message content is required.' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` });
    }

    // Previous turns give the model context. A history lookup failure must not stop
    // the user from getting an answer.
    let history = [];
    if (userId) {
      try {
        const conversation = await AIConversation.findOne({ user: userId }, { messages: { $slice: -HISTORY_CONTEXT_SIZE } }).lean();
        history = conversation ? conversation.messages : [];
      } catch (historyErr) {
        console.warn('Could not load AI chat history:', historyErr.message);
      }
    }

    const aiResult = await getAIResponse(message, history);

    if (userId) {
      try {
        // Atomic append, capped so a long-lived conversation cannot grow without bound.
        await AIConversation.updateOne(
          { user: userId },
          {
            $push: {
              messages: {
                $each: [
                  { sender: 'user', text: message },
                  { sender: 'ai', text: aiResult.reply },
                ],
                $slice: -MAX_STORED_MESSAGES,
              },
            },
          },
          { upsert: true }
        );
      } catch (saveErr) {
        console.warn('Could not save AI chat history:', saveErr.message);
      }
    }

    res.json({
      reply: aiResult.reply,
      isEmergency: !!aiResult.isEmergency,
      suggestAppointment: !!aiResult.suggestAppointment,
    });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  getHistory,
  sendMessageToAI,
};
