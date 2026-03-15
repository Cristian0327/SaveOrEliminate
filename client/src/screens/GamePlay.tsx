import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import Header from '../components/Header';
import { Music, RotateCcw } from 'lucide-react';
import type { Round, GameMode } from '../types';

interface GamePlayProps {
  round: Round;
  totalRounds: number;
  roomId: string;
  isHost: boolean;
  gameMode: GameMode;
  selectionType?: string;
  currentYear?: number;
  currentDecade?: number;
  onTimerEnd: () => void;
}

// Helper: Reproducir audio simple de 10 segundos
function createSimpleAudio(audioElement: HTMLAudioElement) {
  return {
    play: (onComplete?: () => void) => {
      // Obtener el volumen del localStorage o usar 50% por defecto
      const savedVolume = localStorage.getItem('musicVolume');
      const volumePercent = savedVolume ? parseInt(savedVolume) : 50;
      audioElement.volume = volumePercent / 100;
      audioElement.currentTime = 0;
      
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.error('Error playing:', err));
      }

      // Detener después de 10 segundos
      const timeoutId = setTimeout(() => {
        audioElement.pause();
        audioElement.currentTime = 0;
        if (onComplete) onComplete();
      }, 10000);

      return () => clearTimeout(timeoutId);
    },

    stop: () => {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.volume = 0;
    }
  };
}

export default function GamePlay({ round, totalRounds, roomId, gameMode, onTimerEnd }: GamePlayProps) {
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(-1);
  const [previewsPlayed, setPreviewsPlayed] = useState(false);
  const [timer, setTimer] = useState(10);
  const [showingPreview, setShowingPreview] = useState(true);
  const [votingStarted, setVotingStarted] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-play previews de 10 segundos
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    if (currentPreviewIndex >= 0 && currentPreviewIndex < round.songs.length && !previewsPlayed) {
      const song = round.songs[currentPreviewIndex];
      
      if (audioRef.current && song.previewUrl) {
        audioRef.current.src = song.previewUrl;
        const audioHelper = createSimpleAudio(audioRef.current);
        cleanupFn = audioHelper.play(() => {
          setCurrentPreviewIndex(prev => prev + 1);
        });
      }
    } else if (currentPreviewIndex >= round.songs.length && !previewsPlayed) {
      setShowingPreview(false);
      setPreviewsPlayed(true);
    }

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [currentPreviewIndex, round.songs, previewsPlayed]);

  // Timer countdown
  useEffect(() => {
    if (votingStarted && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    }

    if (votingStarted && timer === 0) {
      onTimerEnd();
    }
  }, [votingStarted, timer, onTimerEnd]);

  // Escuchar cambios en votos desde el servidor
  useEffect(() => {
    const handleVoteUpdate = (data: any) => {
      const counts: Record<string, number> = {};
      round.songs.forEach(song => {
        counts[song.id] = data.votes.filter((v: any) => v.songId === song.id).length;
      });
      setVoteCounts(counts);

      // Si todos los jugadores votaron, terminar la ronda automáticamente
      if (data.votes.length === data.players.length && votingStarted) {
        setTimeout(() => {
          onTimerEnd();
        }, 500);
      }
    };

    socket.on('vote-submitted', handleVoteUpdate);
    return () => {
      socket.off('vote-submitted', handleVoteUpdate);
    };
  }, [round.songs, votingStarted, onTimerEnd]);

  const handleSongSelect = (songId: string) => {
    setSelectedSong(songId);
    socket.emit('submit-vote', { roomId, songId });
  };

  const handleReplayPreview = (song: any) => {
    if (playingPreviewId === song.id) {
      // Detener reproducción actual
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingPreviewId(null);
    } else {
      // Reproducir preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      if (audioRef.current && song.previewUrl) {
        audioRef.current.src = song.previewUrl;
        const audioHelper = createSimpleAudio(audioRef.current);
        audioHelper.play(() => {
          setPlayingPreviewId(null);
        });
        setPlayingPreviewId(song.id);
      }
    }
  };

  const handleStartVoting = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingPreviewId(null);
    setVotingStarted(true);
    socket.emit('start-timer', { roomId });
  };

  return (
    <>
      <Header showBackButton={false} showVolume={true} />
      <audio ref={audioRef} style={{ display: 'none' }} />

      <h1 style={{ marginTop: '-1rem', marginBottom: '0.5rem' }}>
        RONDA {round.roundNumber}/{totalRounds}
      </h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        {gameMode === 'save' ? '💚 SALVA UNA CANCIÓN' : '❌ ELIMINA UNA CANCIÓN'}
      </h2>

      {currentPreviewIndex === -1 && (
        <div style={{ textAlign: 'center', padding: 'clamp(20px, 5vh, 60px)' }}>
          <p style={{ fontSize: 'clamp(1rem, 3vw, 1.3rem)', marginBottom: 'clamp(15px, 3vh, 30px)' }}>
            Escucharás <strong>{round.songs.length} canciones</strong> con previews de 10 segundos cada una
          </p>
          <button 
            className="primary" 
            onClick={() => setCurrentPreviewIndex(0)}
            style={{ fontSize: '1.2rem', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '0 auto' }}
          >
            <Music size={24} /> Comenzar Previews
          </button>
        </div>
      )}

      {showingPreview && currentPreviewIndex >= 0 && currentPreviewIndex < round.songs.length && (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div className="loading" style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <Music size={28} /> Reproduciendo...
          </div>
          
          <img 
            src={round.songs[currentPreviewIndex].albumArt} 
            alt={round.songs[currentPreviewIndex].name}
            style={{
              width: 'min(420px, 70vw)',
              height: 'min(420px, 70vw)',
              borderRadius: '24px',
              objectFit: 'cover',
              margin: '0 auto 1.5rem',
              boxShadow: '0 20px 60px rgba(128, 22, 199, 0.4)'
            }}
          />
          <h3 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '0.5rem' }}>{round.songs[currentPreviewIndex].name}</h3>
          <p style={{ fontSize: '1.2rem', opacity: 0.8, textAlign: 'center' }}>{round.songs[currentPreviewIndex].artist}</p>
        </div>
      )}

      {!showingPreview && (
        <>
          {votingStarted && (
            <div style={{ width: '100%', maxWidth: '700px', margin: '1rem auto' }}>
              <div style={{
                width: '100%',
                height: '16px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 0 15px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  width: `${(timer / 10) * 100}%`,
                  height: '100%',
                  background: timer <= 3 ? 'var(--color-eliminate)' : 'var(--color-principal)',
                  borderRadius: '8px',
                  transition: 'width 1s linear, background 0.3s ease',
                  boxShadow: timer <= 3 ? '0 0 20px var(--color-eliminate)' : '0 0 20px var(--color-principal)'
                }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-principal)' }}>
                {timer}s
              </div>
            </div>
          )}

          {!votingStarted && previewsPlayed && (
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button 
                className="primary"
                onClick={handleStartVoting}
                style={{ fontSize: '1.1rem', padding: '15px 30px' }}
              >
                VOTAR
              </button>
            </div>
          )}

          <div className="grid">
            {round.songs.map((song) => {
              const voteCount = voteCounts[song.id] || 0;
              const isSelected = selectedSong === song.id;
              const isEliminate = gameMode === 'eliminate';
              
              return (
                <div
                  key={song.id}
                  className={`song-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => votingStarted && previewsPlayed ? handleSongSelect(song.id) : null}
                  onMouseEnter={(e) => {
                    if (votingStarted && previewsPlayed) {
                      const target = e.currentTarget as HTMLElement;
                      const imgElement = target.querySelector('img') as HTMLImageElement;
                      if (imgElement) {
                        imgElement.style.boxShadow = isEliminate 
                          ? '0 20px 50px rgba(250, 86, 73, 0.6)' 
                          : '0 20px 50px rgba(139, 255, 98, 0.6)';
                      }
                      target.style.transform = 'translateY(-10px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    const imgElement = target.querySelector('img') as HTMLImageElement;
                    if (imgElement) {
                      imgElement.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
                    }
                    target.style.transform = isSelected ? 'scale(1.05)' : 'translateY(0)';
                  }}
                  style={{ 
                    cursor: votingStarted && previewsPlayed ? 'pointer' : 'default', 
                    opacity: previewsPlayed ? 1 : 0.7,
                    position: 'relative',
                  }}
                >
                  {votingStarted && voteCount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      backgroundColor: gameMode === 'eliminate' ? 'var(--color-eliminate)' : 'var(--color-save)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '45px',
                      height: '45px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      zIndex: 10,
                      boxShadow: gameMode === 'eliminate' 
                        ? '0 0 20px rgba(250, 86, 73, 0.6)' 
                        : '0 0 20px rgba(139, 255, 98, 0.6)'
                    }}>
                      {voteCount}
                    </div>
                  )}
                  
                  <img 
                    src={song.albumArt} 
                    alt={song.name}
                    style={{
                      boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <h3 style={{ fontSize: '1.2rem', textAlign: 'center', marginTop: '1rem' }}>{song.name}</h3>
                  <p style={{ fontSize: '1rem', margin: 0, opacity: 0.8, textAlign: 'center' }}>{song.artist}</p>
                  
                  {previewsPlayed && !votingStarted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReplayPreview(song);
                      }}
                      style={{
                        marginTop: '0.8rem',
                        padding: '0',
                        backgroundColor: 'transparent',
                        color: playingPreviewId === song.id ? 'var(--color-eliminate)' : 'var(--color-principal)',
                        border: 'none',
                        borderRadius: '0',
                        cursor: 'pointer',
                        fontSize: '1.4rem',
                        width: 'auto',
                        height: 'auto',
                        transition: 'all 0.3s',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0.8rem auto 0'
                      }}
                    >
                      {playingPreviewId === song.id ? '⏸' : <RotateCcw size={24} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
