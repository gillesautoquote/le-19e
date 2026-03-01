/**
 * networkEvents.ts — Room event binding for the WebSocket connection.
 * Extracted from networkSystem.ts to respect the 250-line limit.
 */
import type { Room } from 'colyseus.js';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { useChatStore } from '@/store/chatStore';
import type {
  ChatMessage,
  ConnectionStatus,
  PlayerAddMsg,
  PlayerMoveMsg,
  PlayerRemoveMsg,
  PlayerCountMsg,
  PlayerEpochMsg,
  ChatServerMsg,
  SystemMessage,
} from '@/types/multiplayer';

function setStatus(status: ConnectionStatus): void {
  useMultiplayerStore.getState().setConnectionStatus(status);
}

function generateChatId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Bind all message handlers to a Colyseus room. */
export function bindRoomEvents(
  r: Room,
  onLeaveReconnect: () => void,
): void {
  const store = useMultiplayerStore;
  const chat = useChatStore;

  r.onMessage('player_add', (data: PlayerAddMsg) => {
    store.getState().setRemotePlayer(data.id, {
      id: data.id,
      name: data.name,
      x: data.x,
      z: data.z,
      rotation: data.rotation,
      anim: data.anim,
      epoch: data.epoch,
    });
  });

  r.onMessage('player_move', (data: PlayerMoveMsg) => {
    store.getState().setRemotePlayer(data.id, {
      x: data.x,
      z: data.z,
      rotation: data.rotation,
      anim: data.anim,
    });
  });

  r.onMessage('player_remove', (data: PlayerRemoveMsg) => {
    store.getState().removeRemotePlayer(data.id);
  });

  r.onMessage('player_count', (data: PlayerCountMsg) => {
    store.getState().setPlayerCount(data.count);
  });

  r.onMessage('player_epoch', (data: PlayerEpochMsg) => {
    store.getState().setRemotePlayer(data.id, {
      epoch: data.epoch,
    });
  });

  r.onMessage('chat', (data: ChatServerMsg) => {
    const msg: ChatMessage = {
      id: generateChatId(),
      playerId: data.playerId,
      name: data.name,
      text: data.text,
      channel: data.channel,
      x: data.x,
      z: data.z,
      timestamp: data.ts,
    };
    chat.getState().addMessage(msg);
  });

  r.onMessage('system', (data: SystemMessage) => {
    const text = data.type === 'join'
      ? `${data.name} a rejoint la balade`
      : `${data.name} est parti`;

    chat.getState().addMessage({
      id: generateChatId(),
      playerId: 'system',
      name: 'Système',
      text,
      channel: 'global',
      x: 0,
      z: 0,
      timestamp: data.ts,
    });
  });

  r.onLeave(() => {
    setStatus('disconnected');
    onLeaveReconnect();
  });

  r.onError((code, message) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[network] Room error ${code}: ${message}`);
    }
    setStatus('error');
  });
}
