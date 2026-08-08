const socketIO = require('socket.io');

const socketManager = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*', // Allow all origins for development
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);

    // Join a room based on User ID or Hospital ID
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    // Handle ambulance live simulated coordinates tracking
    socket.on('update_ambulance_gps', (data) => {
      // Broadcast update to anyone watching map/requests
      io.emit('ambulance_gps_updated', data);
    });

    // Handle general disconnect
    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = socketManager;
