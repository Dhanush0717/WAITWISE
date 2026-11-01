import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [browserNotificationAllowed, setBrowserNotificationAllowed] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const { user } = useAuth();

  useEffect(() => {
    // In dev, Vite proxies /socket.io to http://localhost:5000
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.IO Connected:', newSocket.id);
      setConnected(true);

      if (user) {
        newSocket.emit('join_user', user._id || user.id);
        if (user.role === 'admin') {
          newSocket.emit('join_admin');
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket.IO Disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Request browser notification permissions
  const requestBrowserNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setBrowserNotificationAllowed(granted);
      return granted;
    }
    return false;
  };

  // Helper to trigger browser notification if allowed
  const showBrowserNotification = useCallback((title, body) => {
    if (browserNotificationAllowed && 'Notification' in window) {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }
  }, [browserNotificationAllowed]);

  const joinService = useCallback((serviceId) => {
    if (socket && serviceId) {
      socket.emit('join_service', serviceId);
    }
  }, [socket]);

  const leaveService = useCallback((serviceId) => {
    if (socket && serviceId) {
      socket.emit('leave_service', serviceId);
    }
  }, [socket]);

  const joinTicket = useCallback((ticketId) => {
    if (socket && ticketId) {
      socket.emit('join_ticket', ticketId);
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        browserNotificationAllowed,
        requestBrowserNotifications,
        showBrowserNotification,
        joinService,
        leaveService,
        joinTicket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
