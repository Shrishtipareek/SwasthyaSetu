const Notification = require('../models/Notification');
const { sendError, isValidObjectId, parsePagination } = require('../utils/http');

// @desc    Get user notifications (?page=&limit=, newest first)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { skip, limit } = parsePagination(req.query, { defaultLimit: 30, maxLimit: 100 });

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(notifications);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.recipient.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
