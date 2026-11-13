const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

const socketManager = (server) => {
  const allowedOrigins = process.env.CLIENT_URL
    ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

  const io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error('Socket CORS blocked origin'));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Optional socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'swasthya_setu_secure_jwt_secret_key_9f8d7c6b5a4e3d2c1b0a';
        const decoded = jwt.verify(token, secret);
        socket.user = decoded;
      } catch (err) {
        console.warn('Socket token verification failed, continuing as guest connection');
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id} (Authenticated: ${!!socket.user})`);

    socket.on('join_room', (roomId) => {
      if (!roomId) return;
      socket.join(roomId.toString());
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      if (!roomId) return;
      socket.leave(roomId.toString());
      console.log(`Socket ${socket.id} left room: ${roomId}`);
    });

    // Targeted ambulance GPS updates
    socket.on('update_ambulance_gps', (data) => {
      if (!data) return;

      if (data.hospitalId) {
        io.to(data.hospitalId.toString()).emit('ambulance_gps_updated', data);
      }
      if (data.patientId) {
        io.to(data.patientId.toString()).emit('ambulance_gps_updated', data);
      }
      if (data.emergencyId) {
        io.to(data.emergencyId.toString()).emit('ambulance_gps_updated', data);
      }
      // Also broadcast to the specific ambulance room
      if (data.ambulanceId) {
        io.to(data.ambulanceId.toString()).emit('ambulance_gps_updated', data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = socketManager;
