import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Socket.io Client Singleton
 * Establishes a persistent, bi-directional real-time communication tunnel with the backend LangGraph orchestrator.
 */
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // Prevents rogue connections before authentication or UI mounts
  withCredentials: true,
  transports: ['websocket', 'polling'], // Fallback to long-polling if wss is blocked by enterprise firewalls
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
    console.log('[Socket.io] Connecting to Agent Swarm Engine...');
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('[Socket.io] Disconnected safely.');
  }
};
