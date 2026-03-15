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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {songsWithVotes.map((item: any) => {
              const count = item.voters.length;
              const percentage = votes.length > 0 ? (count / votes.length) * 100 : 0;
              return (
                <div key={item.song.id} style={{
                  display: 'grid',
                  gridTemplateColumns: 'clamp(100px, 20vw, 150px) 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: 'clamp(1rem, 2vw, 1.5rem)',
                }}>
                  {/* LEFT: Imagen + Votantes */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                    <img 
                      src={item.song.albumArt} 
                      alt={item.song.name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                      }}
                    />
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <div style={{ fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.95rem)', marginBottom: '0.2rem', wordBreak: 'break-word' }}>
                        {item.song.name}
                      </div>
                      <div style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)', opacity: 0.7 }}>
                        {item.song.artist}
                      </div>
                      <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'rgba(251, 244, 254, 0.8)', marginTop: '0.5rem', lineHeight: '1.3' }}>
                        <strong>Votaron:</strong> {item.voters.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Barra horizontal ancha */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '100%',
                      height: 'clamp(30px, 5vw, 50px)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--color-principal), var(--color-save))',
                        transition: 'width 0.3s ease',
                        boxShadow: '0 0 15px rgba(128, 22, 199, 0.6)'
                      }} />
                    </div>
                    <div style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 'bold', color: 'var(--color-principal)', textAlign: 'right' }}>
                      {count} votos ({Math.round(percentage)}%)
                    </div>
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
