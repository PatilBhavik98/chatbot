import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../config';
import { getToken } from '../api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      return;
    }
    const token = getToken();
    const s = io(API_BASE || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [isAuthenticated]);

  const value = useMemo(() => socket, [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}