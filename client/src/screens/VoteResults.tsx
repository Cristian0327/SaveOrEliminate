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

export default function VoteResults({ round, votes, isHost, onNextRound, onEndGame }: VoteResultsProps) {
  // const getPlayerName = (playerId: string) => {
  //   return players.find(p => p.id === playerId)?.name || 'Desconocido';
  // };

  // const getSong = (songId: string) => {
  //   return round.songs.find(s => s.id === songId);
  // };

  // Contar votos por canción
  const voteCountBySong = () => {
    const counts: Record<string, number> = {};
    votes.forEach(vote => {
      if (vote.songId !== 'NONE') {
        counts[vote.songId] = (counts[vote.songId] || 0) + 1;
      }
    });
    return counts;
  };

  const voteCounts = voteCountBySong();
  const songsWithVotes = round.songs.filter(song => voteCounts[song.id] && voteCounts[song.id] > 0);
  const sortedSongs = songsWithVotes.sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));

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
        {sortedSongs.length > 0 ? (
          sortedSongs.map((song) => {
            const count = voteCounts[song.id] || 0;
            const percentage = votes.length > 0 ? (count / votes.length) * 100 : 0;
            return (
              <div key={song.id} className="vote-song-bar">
                <img src={song.albumArt} alt={song.name} />
                <div className="song-name" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{song.name}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.8rem' }}>{song.artist}</div>
                <div style={{
                  width: '100%',
                  height: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  marginBottom: '0.8rem'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #8016C7, #6c63ff)',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div className="vote-count" style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-principal)' }}>{count} votos ({Math.round(percentage)}%)</div>
              </div>
            );
          })
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
