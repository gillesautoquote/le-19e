import { useMultiplayerStore } from '@/store/multiplayerStore';
import type { ConnectionStatus as StatusType } from '@/types/multiplayer';

const STATUS_LABELS: Record<StatusType, string> = {
  connected: 'Connecté',
  connecting: 'Connexion...',
  disconnected: 'Hors ligne',
  error: 'Erreur',
};

const STATUS_COLORS: Record<StatusType, string> = {
  connected: '#2ECC71',
  connecting: '#F39C12',
  disconnected: '#95A5A6',
  error: '#E74C3C',
};

export default function ConnectionStatus() {
  const status = useMultiplayerStore((s) => s.connectionStatus);

  return (
    <div className="connection-status" title={STATUS_LABELS[status]}>
      <span
        className="connection-dot"
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {status !== 'connected' && (
        <span className="connection-label">{STATUS_LABELS[status]}</span>
      )}
    </div>
  );
}
