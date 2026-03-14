import { io, Socket } from 'socket.io-client';

// En producción, intenta conectar a Railway. En desarrollo, usa localhost
const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
const SERVER_URL = isProduction 
  ? 'https://saveoreliminateapi.onrender.com'
  : 'http://localhost:3001';

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
});
