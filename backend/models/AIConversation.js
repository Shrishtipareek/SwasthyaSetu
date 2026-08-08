const mongoose = require('mongoose');

const AIConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Allow guest users
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  }]
}, { timestamps: true });

AIConversationSchema.index({ user: 1 });

module.exports = mongoose.model('AIConversation', AIConversationSchema);
