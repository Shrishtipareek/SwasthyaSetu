import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      upgrade: false
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to SwasthyaSetu real-time socket network');
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && user) {
      // Join room for user's own updates
      socket.emit('join_room', user._id);

      // If hospital user, also join room for hospital profile updates
      if (user.role === 'hospital' && user.hospitalProfile) {
        socket.emit('join_room', user.hospitalProfile._id);
      }
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
