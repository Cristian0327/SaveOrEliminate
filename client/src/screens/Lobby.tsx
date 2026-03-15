import type { Room } from '../types';
import Header from '../components/Header';
import { Users, Copy, Crown, Play, Loader } from 'lucide-react';
import React from 'react';

interface LobbyProps {
  room: Room;
  isHost: boolean;
  onStartGame: () => void;
  onBack?: () => void;
}

export default function Lobby({ room, isHost, onStartGame, onBack }: LobbyProps) {
  const [copied, setCopied] = React.useState(false);

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="screen-container">
      <Header onBack={onBack} showBackButton={!!onBack} />
      
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Users size={28} color="var(--color-principal)" /> JUGADORES <span style={{ opacity: 0.5, fontSize: '1.5rem' }}>({room.players.length})</span>
          </h2>
        </div>

        <div className="players-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: '1rem',
          marginBottom: '3rem',
          maxWidth: '900px',
          margin: '0 auto 3rem'
        }}>
          {room.players.map((player) => (
            <div key={player.id} style={{
              background: 'rgba(255,255,255,0.05)',
              border: player.isHost ? '2px solid var(--color-principal)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: player.isHost ? '0 0 20px rgba(128, 22, 199, 0.3)' : 'none',
              transition: 'all 0.3s'
            }}>
              {player.isHost && (
                <div style={{ position: 'absolute', top: -15, background: '#1E1921', padding: '2px 8px', borderRadius: '12px' }}>
                  <Crown size={16} color="#FFD700" fill="#FFD700" />
                </div>
              )}
              <div style={{ 
                width: '60px', height: '60px', 
                background: player.isHost ? 'var(--color-principal)' : 'rgba(128, 22, 199, 0.2)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
                fontSize: '1.8rem',
                fontWeight: 'bold'
              }}>
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {player.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ alignItems: 'center', textAlign: 'center', marginBottom: '4rem', background: 'transparent', border: 'none', boxShadow: 'none' }}>
        <p className="text-small" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>SALA DE JUEGO</p>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '2.5rem', letterSpacing: '6px' }}>
          {room.id}
        </h1>
        
        <button 
          onClick={copyRoomLink} 
          className="secondary" 
          style={{ width: 'auto', padding: '0.8rem 1.5rem', fontSize: '0.9rem', background: copied ? 'rgba(139, 255, 98, 0.2)' : 'transparent', transition: 'all 0.3s' }}
        >
          <Copy size={16} /> {copied ? '¡Copiado!' : 'Copiar Enlace'}
        </button>
      </div>

      <div style={{ marginTop: '3rem' }}>
        {isHost ? (
          <button
            className="primary"
            onClick={onStartGame}
            disabled={room.players.length < 1}
            style={{ width: '100%', padding: '1.5rem' }}
          >
            <Play size={24} fill="currentColor" /> CONFIGURAR PARTIDA
          </button>
        ) : (
          <div className="card" style={{ background: 'rgba(128, 22, 199, 0.1)', border: '1px solid var(--color-principal)', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <Loader size={24} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', textAlign: 'left' }}>ESPERANDO AL HOST</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', textAlign: 'left', opacity: 0.7 }}>El anfitrión está configurando la partida...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
