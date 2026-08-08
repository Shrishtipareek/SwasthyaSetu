const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'alert', 'warning', 'critical'],
    default: 'info',
  },
  read: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1 });
NotificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
