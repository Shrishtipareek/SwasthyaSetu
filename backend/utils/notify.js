const Notification = require('../models/Notification');

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

/**
 * Persist a notification AND push it to the recipient in real time
 * (the frontend Navbar listens for `notification_received`).
 * Never throws: a failed notification must not break the main request.
 */
const notify = async (recipient, message, type = 'info') => {
  if (!recipient) return null;
  try {
    const notification = await Notification.create({ recipient, message, type });
    if (ioInstance) {
      ioInstance.to(recipient.toString()).emit('notification_received', notification);
    }
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Emit to one room or several rooms only when Socket.IO is available.
 * Passing several rooms in one call delivers the event once per socket even if
 * the socket is in more than one of them (e.g. a hospital admin's user room and
 * hospital room).
 */
const emitTo = (rooms, event, payload) => {
  if (!ioInstance) return;
  const list = (Array.isArray(rooms) ? rooms : [rooms]).filter(Boolean).map((r) => r.toString());
  if (list.length) ioInstance.to(list).emit(event, payload);
};

const emitAll = (event, payload) => {
  if (ioInstance) ioInstance.emit(event, payload);
};

module.exports = { setIO, getIO, notify, emitTo, emitAll };
