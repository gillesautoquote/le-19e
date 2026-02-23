/**
 * networkSystem.ts — Singleton WebSocket network manager.
 *
 * State lives at module level (not Zustand) for zero re-render overhead.
 * Components call broadcastPosition() from useFrame.
 * Pattern: same as npcSystem.ts and inputSystem.ts.
 */
import { Client, type Room } from 'colyseus.js';
import { MULTIPLAYER } from '@/constants/multiplayer';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { useChatStore } from '@/store/chatStore';
import type {
  ConnectionStatus,
  PositionPayload,
  ChatPayload,
  ChatMessage,
} from '@/types/multiplayer';

// ─── Module-level state ─────────────────────────────────────────

let client: Client | null = null;
let room: Room | null = null;
let lastBroadcast = 0;
let lastX = 0;
let lastZ = 0;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let disposed = false;

const WS_URL = import.meta.env.VITE_WS_URL
  || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

// ─── Helpers ────────────────────────────────────────────────────

function setStatus(status: ConnectionStatus): void {
  useMultiplayerStore.getState().setConnectionStatus(status);
}

function generateChatId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Room event binding ─────────────────────────────────────────

function bindRoomEvents(r: Room): void {
  const store = useMultiplayerStore;
  const chat = useChatStore;

  // Player state changes (Colyseus schema callbacks)
  r.state.players.onAdd((player: Record<string, unknown>, key: string) => {
    store.getState().setRemotePlayer(key, {
      id: key as string,
      name: player.name as string,
      x: player.x as number,
      z: player.z as number,
      rotation: player.rotation as number,
      anim: player.anim as number,
      epoch: player.epoch as 'A' | 'B',
    });

    // Listen for individual field changes
    player.onChange = () => {
      store.getState().setRemotePlayer(key, {
        x: player.x as number,
        z: player.z as number,
        rotation: player.rotation as number,
        anim: player.anim as number,
        epoch: player.epoch as 'A' | 'B',
      });
    };
  });

  r.state.players.onRemove((_player: unknown, key: string) => {
    store.getState().removeRemotePlayer(key);
  });

  // Player count
  r.state.listen('playerCount', (count: number) => {
    store.getState().setPlayerCount(count);
  });

  // Chat messages
  r.onMessage('chat', (data: {
    playerId: string;
    name: string;
    text: string;
    channel: 'global' | 'proximity';
    x: number;
    z: number;
    ts: number;
  }) => {
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

  // System messages (join/leave)
  r.onMessage('system', (data: {
    type: 'join' | 'leave';
    playerId: string;
    name: string;
    ts: number;
  }) => {
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
    if (!disposed) attemptReconnect();
  });

  r.onError((code, message) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[network] Room error ${code}: ${message}`);
    }
    setStatus('error');
  });
}

// ─── Reconnection ───────────────────────────────────────────────

function attemptReconnect(): void {
  if (disposed || reconnectAttempts >= MULTIPLAYER.reconnectMaxRetries) return;

  reconnectAttempts++;
  const delay = MULTIPLAYER.reconnectBaseDelay * Math.pow(2, reconnectAttempts - 1);
  setStatus('connecting');

  reconnectTimer = setTimeout(async () => {
    try {
      const name = useMultiplayerStore.getState().localName;
      await connectToRoom(name);
      reconnectAttempts = 0;
    } catch {
      attemptReconnect();
    }
  }, delay);
}

async function connectToRoom(name: string): Promise<void> {
  if (!client) return;
  room = await client.joinOrCreate('world', { name });
  useMultiplayerStore.getState().setLocalId(room.sessionId);
  bindRoomEvents(room);
  setStatus('connected');
}

// ─── Public API ─────────────────────────────────────────────────

export async function initNetwork(name: string): Promise<void> {
  disposed = false;
  reconnectAttempts = 0;

  useMultiplayerStore.getState().setLocalName(name);
  setStatus('connecting');

  client = new Client(WS_URL);

  try {
    await connectToRoom(name);
  } catch {
    setStatus('error');
    attemptReconnect();
  }
}

export function disposeNetwork(): void {
  disposed = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (room) room.leave();
  room = null;
  client = null;
  setStatus('disconnected');
}

export function broadcastPosition(
  x: number,
  z: number,
  rotation: number,
  anim: number,
): void {
  if (!room) return;

  const now = performance.now();
  if (now - lastBroadcast < MULTIPLAYER.positionBroadcastInterval) return;

  // Skip if position unchanged
  const dx = x - lastX;
  const dz = z - lastZ;
  if (dx * dx + dz * dz < MULTIPLAYER.positionDeltaThreshold * MULTIPLAYER.positionDeltaThreshold) {
    // Still send if anim changed (idle↔walk transition)
    return;
  }

  lastBroadcast = now;
  lastX = x;
  lastZ = z;

  const payload: PositionPayload = { x, z, rotation, anim };
  room.send('position', payload);
}

export function sendChat(text: string, channel: 'global' | 'proximity'): void {
  if (!room) return;
  const trimmed = text.trim().slice(0, MULTIPLAYER.chatMaxLength);
  if (trimmed.length === 0) return;

  const payload: ChatPayload = { text: trimmed, channel };
  room.send('chat', payload);
}

export function sendEpoch(epoch: 'A' | 'B'): void {
  if (!room) return;
  room.send('epoch', { epoch });
}

export function getConnectionStatus(): ConnectionStatus {
  return useMultiplayerStore.getState().connectionStatus;
}
