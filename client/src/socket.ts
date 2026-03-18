import { io, Socket } from 'socket.io-client';

// Conectar al servidor
const getServerUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const isProduction = !window.location.hostname.includes('localhost') && 
                       !window.location.hostname.includes('127.0.0.1') &&
                       !window.location.hostname.includes('192.168');
  
  if (isProduction) {
    // En producción: usar VITE_API_URL o fallback a Render
    const apiUrl = (import.meta as any).env.VITE_API_URL || 'https://save-or-eliminate-server.onrender.com';
    console.log('[Socket] Production mode - API URL:', apiUrl);
    return apiUrl;
  }
  
  // En desarrollo: conecta a localhost:3001
  const url = `http://localhost:3001`;
  console.log('[Socket] Development mode - connecting to:', url);
  return url;
};

const serverUrl = getServerUrl();
console.log('[Socket] Final URL:', serverUrl);

export const socket: Socket = io(serverUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: Infinity,
  transports: ['websocket', 'polling']
});
