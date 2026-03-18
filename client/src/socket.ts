import { io, Socket } from 'socket.io-client';

// Conectar al servidor: en producción usa la variable de entorno, en desarrollo usa localhost o IP local
const getServerUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const isProduction = !window.location.hostname.includes('localhost') && 
                       !window.location.hostname.includes('127.0.0.1') &&
                       !window.location.hostname.includes('192.168');
  
  if (isProduction) {
    // En producción, SIEMPRE necesita VITE_API_URL configurado
    const apiUrl = (import.meta as any).env.VITE_API_URL;
    console.log('[Socket] Production mode - API URL:', apiUrl);
    if (!apiUrl) {
      console.error('[Socket] ERROR: VITE_API_URL no configurado en Vercel');
      throw new Error('VITE_API_URL environment variable not set');
    }
    return apiUrl;
  }
  
  // En desarrollo, conecta a localhost:3001
  const url = `http://localhost:3001`;
  console.log('[Socket] Development mode - connecting to:', url);
  return url;
};

let serverUrl = '';
try {
  serverUrl = getServerUrl();
} catch (err) {
  console.error('[Socket] Fatal error getting server URL:', err);
  serverUrl = 'http://localhost:3001'; // Fallback
}

console.log('[Socket] Connecting to:', serverUrl);

export const socket: Socket = io(serverUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: Infinity,
  transports: ['websocket', 'polling']
});
