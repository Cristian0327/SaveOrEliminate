import { io, Socket } from 'socket.io-client';

// Conectar al servidor: en producción usa el mismo dominio, en desarrollo usa localhost
const getServerUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const isProduction = !window.location.hostname.includes('localhost') && 
                       !window.location.hostname.includes('127.0.0.1');
  
  if (isProduction) {
    // En Vercel o production, usa el mismo dominio
    return window.location.origin;
  }
  
  return 'http://localhost:3001';
};

export const socket: Socket = io(getServerUrl(), {
  autoConnect: true,
});
