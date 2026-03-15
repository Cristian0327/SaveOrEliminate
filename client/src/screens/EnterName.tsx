import { useState } from 'react';

interface EnterNameProps {
  onSubmit: (name: string) => void;
}

export default function EnterName({ onSubmit }: EnterNameProps) {
  const [name, setName] = useState('');

  return (
    <div className="screen-container">
      <h1>¿Cuál es tu nombre?</h1>
      <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          style={{ marginBottom: '2.5rem' }}
        />
        <button
          className="primary"
          onClick={() => onSubmit(name)}
          disabled={name.trim().length === 0}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
