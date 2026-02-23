import { useState, useEffect, type KeyboardEvent } from 'react';
import { MULTIPLAYER } from '@/constants/multiplayer';

interface NamePromptProps {
  onSubmit: (name: string) => void;
}

const STORAGE_KEY = 'le19e-player-name';

function generateDefaultName(): string {
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${MULTIPLAYER.nameDefault}${suffix}`;
}

export default function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setName(saved);
    else setName(generateDefaultName());
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim().slice(0, MULTIPLAYER.nameMaxLength);
    const finalName = trimmed || generateDefaultName();
    localStorage.setItem(STORAGE_KEY, finalName);
    onSubmit(finalName);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="name-prompt-overlay">
      <div className="name-prompt-card">
        <h2 className="name-prompt-title">Comment t&apos;appelles-tu ?</h2>
        <input
          className="name-prompt-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, MULTIPLAYER.nameMaxLength))}
          onKeyDown={handleKeyDown}
          maxLength={MULTIPLAYER.nameMaxLength}
          autoFocus
          placeholder={MULTIPLAYER.nameDefault}
        />
        <button className="name-prompt-button" onClick={handleSubmit}>
          Explorer
        </button>
      </div>
    </div>
  );
}
