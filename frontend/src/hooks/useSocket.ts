import { useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';

/**
 * Custom React Hook for Socket.io
 * Manages connection state and lifecycle binding to React components.
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    connectSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      // Cleanup prevents memory leaks on unmount
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      disconnectSocket();
    };
  }, []);

  return { socket, isConnected };
}
