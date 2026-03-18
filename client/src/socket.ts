import { io, Socket } from 'socket.io-client';

// Conectar al servidor
const getServerUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const isProduction = !window.location.hostname.includes('localhost') && 
                       !window.location.hostname.includes('127.0.0.1') &&
                       !window.location.hostname.includes('192.168');
  
  if (isProduction) {
    // En producción: conectar a Render
    return 'https://saveoreliminate.onrender.com';
  }
  
  // En desarrollo: conecta a localhost:3001
  return `http://localhost:3001`;
};

const serverUrl = getServerUrl();

export const socket: Socket = io(serverUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: Infinity,
  transports: ['websocket', 'polling'],
});

// Eventos de debug
socket.on('connect', () => {
  console.log('[Socket] ✓ Conectado al servidor:', serverUrl);
});

socket.on('connect_error', (error) => {
  console.error('[Socket] ✗ Error de conexión:', error.message);
});

socket.on('disconnect', (reason) => {
  console.warn('[Socket] Desconectado:', reason);
});
