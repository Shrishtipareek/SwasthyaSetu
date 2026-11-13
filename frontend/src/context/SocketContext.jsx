import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (
      import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
        : 'http://localhost:5000'
    );

    const token = localStorage.getItem('token');
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: token || '' },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to SwasthyaSetu real-time socket network:', newSocket.id);
    });

    return () => {
      newSocket.close();
    };
  }, [user?._id]);

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
