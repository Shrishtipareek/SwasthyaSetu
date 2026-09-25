const AIConversation = require("../models/AIConversation");
const { getAIResponse } = require("../utils/gemini");

const getHistory = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      return res.json([]);
    }

    let conversation =
      await AIConversation.findOne({
        user: userId,
      });

    if (!conversation) {
      conversation =
        await AIConversation.create({
          user: userId,
          messages: [],
        });
    }

    return res.json(conversation.messages);
  } catch (error) {
    console.error(
      "AI history error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to load AI history.",
    });
  }
};

const sendMessageToAI = async (req, res) => {
  try {
    const { message } = req.body;

    const userId = req.user
      ? req.user._id
      : null;

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        message:
          "Please describe your symptoms.",
      });
    }

    let conversation = null;
    let history = [];

    if (userId) {
      conversation =
        await AIConversation.findOne({
          user: userId,
        });

      if (!conversation) {
        conversation =
          await AIConversation.create({
            user: userId,
            messages: [],
          });
      }

      history =
        conversation.messages.slice(-10);
    }

    const aiResult = await getAIResponse(
      message.trim(),
      history
    );

    if (userId && conversation) {
      conversation.messages.push({
        sender: "user",
        text: message.trim(),
      });

      conversation.messages.push({
        sender: "ai",
        text: aiResult.reply,
      });

      await conversation.save();
    }

    return res.json({
      success: true,
      reply: aiResult.reply,
      isEmergency:
        aiResult.isEmergency || false,
      suggestAppointment:
        aiResult.suggestAppointment || false,
    });
  } catch (error) {
    console.error(
      "AI controller error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate AI response.",
    });
  }
};

module.exports = {
  getHistory,
  sendMessageToAI,
};