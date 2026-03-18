import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as gameManager from './gameManager.js';
import type { GameConfig } from './types.js';
import * as deezer from './deezer.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
    credentials: false
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io/',
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({
  origin: "*",
  credentials: false,
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Inicializar Redis al arrancar
gameManager.initRedis().catch(err => console.warn('Redis init failed:', err));

const pendingDisconnectCleanup = new Map<string, NodeJS.Timeout>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

io.on('connection', (socket) => {
  console.log('[Socket] ✓ User connected:', socket.id);
  console.log('[Socket] Total connected clients:', io.engine.clientsCount);

  // Enviar ping al cliente para mantener viva la conexión
  const pingInterval = setInterval(() => {
    try {
      socket.emit('ping');
    } catch (err) {
      console.error('[Socket] Error emitting ping:', err);
    }
  }, 25000);

  // Canal para que el cliente responda pongs
  socket.on('pong', () => {
    console.log('[Socket] Pong received from', socket.id);
  });

  // Log de desconexión
  socket.on('disconnect', (reason) => {
    console.log('[Socket] ✗ User disconnected:', socket.id, 'Reason:', reason);
    console.log('[Socket] Remaining clients:', io.engine.clientsCount);
    clearInterval(pingInterval);

    // Grace period para reconexiones rápidas (evita borrar sala por cortes breves)
    const timeout = setTimeout(() => {
      pendingDisconnectCleanup.delete(socket.id);
      const result = gameManager.findAndRemovePlayerFromAllRooms(socket.id);
      if (result) {
        const { roomId, room, playerName } = result;

        if (room.players.length > 0) {
          io.to(roomId).emit('player-left', {
            room: room,
            message: `${playerName} se ha desconectado`,
          });
        } else {
          console.log(`[Socket] Room ${roomId} deleted (no players left)`);
        }
      }
    }, 45000);

    pendingDisconnectCleanup.set(socket.id, timeout);
  });

  // Log de errores CON DETALLE
  socket.on('error', (error) => {
    console.error('[Socket] Error from client:', socket.id, error);
  });

  socket.on('connect_error', (error: any) => {
    console.error('[Socket] Connection error for client:', socket.id, error.message);
  });

  socket.on('create-room', ({ playerName, playerAvatar }) => {
    try {
      const room = gameManager.createRoom(playerName, socket.id, playerAvatar);
      socket.join(room.id);
      socket.emit('room-created', room);
      console.log(`[Socket] Room created: ${room.id} by ${playerName}`);
    } catch (err) {
      console.error('[Socket] Error in create-room:', err);
      socket.emit('error', { message: 'Error creating room' });
    }
  });

  socket.on('join-room', async ({ roomId, playerName, playerAvatar }) => {
    try {
      const normalizedRoomId = String(roomId ?? '').trim().toUpperCase();

      // Retry breve para evitar falsos "no encontrada" por carreras/reconexiones
      let roomSnapshot = await gameManager.getRoomWithRedis(normalizedRoomId);
      for (let attempt = 0; !roomSnapshot && attempt < 5; attempt += 1) {
        await sleep(400);
        roomSnapshot = await gameManager.getRoomWithRedis(normalizedRoomId);
      }

      if (!roomSnapshot) {
        socket.emit('error', { message: 'La sala no existe o expiró. Pídele al host crear una nueva.' });
        return;
      }

      if (roomSnapshot.players.length >= 8) {
        socket.emit('error', { message: 'La sala está llena (máximo 8 jugadores).' });
        return;
      }

      const room = gameManager.joinRoom(normalizedRoomId, playerName, socket.id, playerAvatar);
      if (room) {
        socket.join(normalizedRoomId);
        socket.emit('room-joined', room);
        io.to(normalizedRoomId).emit('player-joined', room);
        console.log(`[Socket] ${playerName} joined room ${normalizedRoomId}`);
      } else {
        socket.emit('error', { message: 'No se pudo unir a la sala. Intenta nuevamente.' });
      }
    } catch (err) {
      console.error('[Socket] Error in join-room:', err);
      socket.emit('error', { message: 'Error joining room' });
    }
  });

  socket.on('start-game', async ({ roomId, config }: { roomId: string; config: GameConfig }) => {
    console.log('=== START-GAME EVENT ===');
    console.log('RoomId:', roomId);
    console.log('Config received:', JSON.stringify(config, null, 2));

    // Emitir evento de carga inicial
    io.to(roomId).emit('game-loading', { loadedYears: 0, totalYears: config.selectionType === 'year' && config.yearRange
      ? config.yearRange.end - config.yearRange.start + 1
      : 0
    });

    const success = await gameManager.startGame(roomId, config, (loadedYears, totalYears) => {
      // Emitir progreso de carga año a año
      io.to(roomId).emit('game-loading', { loadedYears, totalYears });
    });

    if (success) {
      console.log('[start-game] StartGame returned success, generating first round...');
      const round = await gameManager.generateRound(roomId);
      if (round) {
        const room = gameManager.getRoom(roomId);
        const currentYear = config.selectionType === 'year' && config.yearRange 
          ? config.yearRange.start 
          : null;
        const currentDecade = config.selectionType === 'decade' && config.decadeRange
          ? config.decadeRange.start
          : null;
        console.log('[start-game] Emitting game-started with totalRounds:', room?.totalRounds);
        io.to(roomId).emit('game-started', { 
          round, 
          totalRounds: room?.totalRounds,
          currentYear,
          currentDecade,
          selectionType: config.selectionType,
          mode: config.mode
        });
        console.log(`Game started in room ${roomId}, round 1/${room?.totalRounds}`);
      } else {
        console.error(`Failed to generate first round in room ${roomId}`);
        io.to(roomId).emit('game-error', {
          message: 'No se pudieron cargar canciones para iniciar la partida. Prueba otro artista/genero/rango.'
        });
      }
    } else {
      console.error('[start-game] StartGame FAILED');
      io.to(roomId).emit('game-error', { message: 'No se pudo iniciar la partida.' });
    }
  });


  socket.on('start-timer', ({ roomId }) => {
    gameManager.startTimer(roomId);
    io.to(roomId).emit('timer-started');
  });

  socket.on('toggle-pause', ({ roomId }) => {
    gameManager.togglePause(roomId);
    const room = gameManager.getRoom(roomId);
    io.to(roomId).emit('timer-paused', { isPaused: room?.currentRound?.isPaused });
  });

  socket.on('submit-vote', ({ roomId, songId }) => {
    gameManager.submitVote(roomId, socket.id, songId);
    const room = gameManager.getRoom(roomId);
    if (room?.currentRound) {
      io.to(roomId).emit('vote-submitted', {
        votes: room.currentRound.votes,
        players: room.players,
      });
    }
  });

  socket.on('next-round', async ({ roomId }) => {
    const round = await gameManager.generateRound(roomId);
    const room = gameManager.getRoom(roomId);
    
    if (round) {
      const currentYear = room?.gameConfig?.selectionType === 'year' && room.gameConfig.yearRange
        ? room.gameConfig.yearRange.start + (round.roundNumber - 1)
        : null;
      const currentDecade = room?.gameConfig?.selectionType === 'decade' && room.gameConfig.decadeRange
        ? room.gameConfig.decadeRange.start + (round.roundNumber - 1) * 10
        : null;
      io.to(roomId).emit('new-round', { 
        round, 
        totalRounds: room?.totalRounds,
        currentYear,
        currentDecade,
        selectionType: room?.gameConfig?.selectionType,
        mode: room?.gameConfig?.mode
      });
      console.log(`New round in room ${roomId}: ${round.roundNumber}/${room?.totalRounds}`);
    } else {
      io.to(roomId).emit('game-finished');
      console.log(`Game finished in room ${roomId}`);
    }
  });

  socket.on('start-previews', ({ roomId }) => {
    console.log(`[start-previews] Starting previews in room ${roomId}`);
    io.to(roomId).emit('previews-started');
  });

  socket.on('start-voting', ({ roomId }) => {
    console.log(`[start-voting] Starting voting in room ${roomId}`);
    const room = gameManager.getRoom(roomId);
    if (room?.currentRound) {
      io.to(roomId).emit('voting-started', {
        round: room.currentRound,
        votes: room.currentRound.votes
      });
    }
  });

  socket.on('end-game', ({ roomId }) => {
    console.log(`Host ended game in room ${roomId}`);
    io.to(roomId).emit('game-finished');
  });

  socket.on('reset-game', ({ roomId }) => {
    gameManager.resetGame(roomId);
    const room = gameManager.getRoom(roomId);
    io.to(roomId).emit('game-reset', room);
  });

  socket.on('get-top-artists', async (callback) => {
    const artists = await deezer.getTopArtists();
    callback(artists);
  });

  socket.on('get-top-genres', async (callback) => {
    const genres = await deezer.getTopGenres();
    callback(genres);
  });

  socket.on('search-artists', async ({ query }, callback) => {
    const artists = await deezer.searchArtists(query);
    callback(artists);
  });

  socket.on('search-genres', async ({ query }, callback) => {
    const genres = await deezer.searchGenres(query);
    callback(genres);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
