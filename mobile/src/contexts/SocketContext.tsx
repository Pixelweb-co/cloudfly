import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import * as SecureStore from 'expo-secure-store';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeDashboard: () => void;
  unsubscribeDashboard: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://chat.cloudfly.com.co';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const tenantId = user?.activeCompanyId || user?.customerId;

    console.log('🔌 Conectando a Socket.IO (Mobile):', SOCKET_URL, 'Tenant:', tenantId);

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
        tenantId,
      },
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket conectado (Mobile):', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket desconectado (Mobile)');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, token, user]);

  const subscribeDashboard = () => {
    if (socket) socket.emit('subscribe-dashboard');
  };

  const unsubscribeDashboard = () => {
    if (socket) socket.emit('unsubscribe-dashboard');
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, subscribeDashboard, unsubscribeDashboard }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
