const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { getJwtSecret } = require('../config/env');
const { corsOrigin } = require('../config/cors');
const { setIO } = require('../utils/notify');

const socketManager = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Optional authentication: guests may connect (public broadcasts), but only
  // authenticated sockets may join private rooms or publish GPS updates.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '') ||
        null;

      if (token) {
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.id).select('_id role');
        if (user) {
          socket.data.user = { _id: user._id.toString(), role: user.role };
          if (user.role === 'hospital') {
            const hospital = await Hospital.findOne({ user: user._id }).select('_id');
            if (hospital) socket.data.hospitalId = hospital._id.toString();
          }
        }
      }
    } catch (error) {
      // Invalid / expired token -> treat as guest instead of refusing the connection.
    }
    next();
  });

  io.on('connection', (socket) => {
    const { user, hospitalId } = socket.data;

    // Auto-join own rooms so server-side emits reach the user even if the
    // client never calls join_room.
    if (user) {
      socket.join(user._id);
      if (hospitalId) socket.join(hospitalId);
    }

    // Join a room based on User ID or Hospital ID (only your own). Joining any
    // room by id would let anyone read another user's private notifications.
    socket.on('join_room', (roomId) => {
      const room = roomId ? roomId.toString() : '';
      const allowed =
        user && (room === user._id || (hospitalId && room === hospitalId) || ['admin', 'superadmin'].includes(user.role));
      if (allowed) {
        socket.join(room);
      } else {
        socket.emit('join_room_error', { roomId: room, message: 'Not authorized to join this room' });
      }
    });

    socket.on('leave_room', (roomId) => {
      if (!roomId) return;
      socket.leave(roomId.toString());
    });

    // Ambulance live GPS: only hospital accounts may publish, and updates go only
    // to the rooms involved (publishing hospital, patient, emergency, ambulance)
    // instead of being broadcast to every connected client.
    socket.on('update_ambulance_gps', (data) => {
      if (!user || user.role !== 'hospital') return;
      if (!data || !Number.isFinite(Number(data.lat)) || !Number.isFinite(Number(data.lng))) return;
      const payload = { ...data, lat: Number(data.lat), lng: Number(data.lng), hospitalId };
      const rooms = [hospitalId, data.patientId, data.emergencyId, data.ambulanceId]
        .filter(Boolean)
        .map((r) => r.toString());
      if (rooms.length) io.to(rooms).emit('ambulance_gps_updated', payload);
    });
  });

  setIO(io);
  return io;
};

module.exports = socketManager;
