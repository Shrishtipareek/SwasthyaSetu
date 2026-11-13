import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const userId = user?._id;
  const hospitalId = user?.hospitalProfile?._id;

  // (Re)connect whenever the logged-in account changes. The server authenticates
  // the socket with the JWT sent in the handshake and only then allows it into the
  // user's / hospital's private rooms, so a socket opened before login (or with an
  // old token) would never receive notifications.
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      // WebSocket first, long-polling as a fallback for networks that block WebSockets.
      transports: ['websocket', 'polling'],
      // Evaluated on every (re)connection, so the current token is always sent.
      auth: (cb) => cb({ token: localStorage.getItem('token') || undefined }),
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to SwasthyaSetu real-time socket network');
      // The server already auto-joins these rooms for authenticated sockets;
      // re-joining after a reconnect is harmless.
      if (userId) newSocket.emit('join_room', userId);
      if (hospitalId) newSocket.emit('join_room', hospitalId);
    });

    return () => newSocket.close();
  }, [userId, hospitalId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
