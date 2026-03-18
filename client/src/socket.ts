import { io, Socket } from 'socket.io-client';

// Conectar al servidor
const getServerUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const isProduction = !window.location.hostname.includes('localhost') && 
                       !window.location.hostname.includes('127.0.0.1') &&
                       !window.location.hostname.includes('192.168');
  
  return isProduction 
    ? 'https://saveoreliminate.onrender.com'
    : 'http://localhost:3001';
};

const serverUrl = getServerUrl();

export const socket: Socket = io(serverUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: 999,
  transports: ['websocket', 'polling'],
  upgrade: true,
});

// Eventos de debug y recuperación
socket.on('connect', () => {
  console.log('[Socket] ✓ CONECTADO a:', serverUrl);
});

socket.on('connect_error', (error: any) => {
  console.error('[Socket] ✗ Error:', error.message || error);
});

socket.on('disconnect', (reason: string) => {
  console.warn('[Socket] Desconectado -', reason);
  // Forzar reconexión si se desconecta
  if (reason !== 'io client namespace disconnect') {
    setTimeout(() => {
      if (!socket.connected) {
        console.log('[Socket] Intentando reconectar...');
        socket.connect();
      }
    }, 2000);
  }
});

// Responder a pings del servidor para mantener la conexión viva
socket.on('ping', () => {
  socket.emit('pong');
  console.log('[Socket] Pong enviado');
});
