import Header from '../components/Header';
import type { Round, Player, Vote } from '../types';

interface VoteResultsProps {
  round: Round;
  players: Player[];
  votes: Vote[];
  isHost: boolean;
  roomId: string;
  onNextRound: () => void;
  onEndGame?: () => void;
}

export default function VoteResults({ round, votes, players, isHost, onNextRound, onEndGame }: VoteResultsProps) {
  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Desconocido';
  };

  // Agrupar votos por canción
  const votesByColor = () => {
    const colorMap: Record<string, any> = {};
    round.songs.forEach(song => {
      colorMap[song.id] = {
        song,
        voters: votes
          .filter(v => v.songId === song.id)
          .map(v => getPlayerName(v.playerId))
      };
    });
    return colorMap;
  };

  const allVotesByColor = votesByColor();
  const songsWithVotes = Object.values(allVotesByColor).filter(item => item.voters.length > 0);

  return (
    <>
      <Header showBackButton={false} />
      <h1>Resultados - Ronda {round.roundNumber}</h1>
      {round.yearLabel && (
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
          color: '#fff',
          borderRadius: '30px',
          padding: '8px 24px',
          fontSize: '1.4rem',
          fontWeight: 700,
          letterSpacing: '2px',
          marginBottom: '2rem',
          boxShadow: '0 4px 16px rgba(108,99,255,0.3)',
        }}>
          📅 {round.yearLabel}
        </div>
      )}

      <div className="vote-summary">
        {songsWithVotes.length > 0 ? (
          songsWithVotes.map((item: any) => (
            <div key={item.song.id} className="vote-song-bar">
              <img src={item.song.albumArt} alt={item.song.name} />
              <div className="song-name" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.song.name}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.8rem' }}>{item.song.artist}</div>
              <div style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--color-principal)', fontWeight: 500 }}>
                {item.voters.join(', ')}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', opacity: 0.7, width: '100%' }}>
            Nadie votó en esta ronda
          </p>
        )}
      </div>

      {isHost && (
        <div style={{ marginTop: '3rem', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <button className="primary" onClick={onNextRound} style={{ fontSize: '1.1rem', padding: '1.2rem', fontWeight: 'bold' }}>
            Siguiente Ronda
          </button>
          {onEndGame && (
            <button 
              className="eliminate" 
              onClick={onEndGame} 
              style={{ fontSize: '1.1rem', padding: '1.2rem', fontWeight: 'bold' }}
            >
              Acabar Partida
            </button>
          )}
        </div>
      )}

      {!isHost && (
        <p style={{ textAlign: 'center', opacity: 0.7, marginTop: '2rem', fontSize: '1.1rem' }}>
          Esperando a que el host continúe...
        </p>
      )}
    </>
  );
}
