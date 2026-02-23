import { useMultiplayerStore } from '@/store/multiplayerStore';

export default function PlayerCount() {
  const count = useMultiplayerStore((s) => s.playerCount);

  if (count <= 0) return null;

  return (
    <div className="player-count">
      {count} {count === 1 ? 'flâneur' : 'flâneurs'}
    </div>
  );
}
