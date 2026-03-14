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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%' }}>
            {songsWithVotes.map((item: any) => {
              const count = item.voters.length;
              const percentage = votes.length > 0 ? (count / votes.length) * 100 : 0;
              return (
                <div key={item.song.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                }}>
                  {/* Imagen de la canción */}
                  <img 
                    src={item.song.albumArt} 
                    alt={item.song.name}
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}
                  />
                  
                  {/* Nombre y artista */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.3rem' }}>
                      {item.song.name}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                      {item.song.artist}
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div style={{
                    width: '100%',
                    height: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--color-principal), var(--color-save))',
                      transition: 'width 0.3s ease',
                      boxShadow: '0 0 15px rgba(128, 22, 199, 0.5)'
                    }} />
                  </div>
                  
                  {/* Número de votos */}
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-principal)' }}>
                    {count} {count === 1 ? 'voto' : 'votos'} ({Math.round(percentage)}%)
                  </div>
                  
                  {/* Nombres de quien votó */}
                  <div style={{ fontSize: '0.85rem', color: 'rgba(251, 244, 254, 0.8)', textAlign: 'center', lineHeight: '1.4' }}>
                    {item.voters.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
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
