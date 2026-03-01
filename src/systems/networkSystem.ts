/**
 * networkSystem.ts — Singleton WebSocket network manager.
 *
 * State lives at module level (not Zustand) for zero re-render overhead.
 * Components call broadcastPosition() from useFrame.
 *
 * Sync strategy: message-based (not Schema auto-sync).
 */
import { Client, type Room } from 'colyseus.js';
import { MULTIPLAYER } from '@/constants/multiplayer';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { bindRoomEvents } from '@/systems/networkEvents';
import type { ConnectionStatus, PositionPayload, ChatPayload } from '@/types/multiplayer';

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

function setStatus(status: ConnectionStatus): void {
  useMultiplayerStore.getState().setConnectionStatus(status);
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
  bindRoomEvents(room, () => {
    if (!disposed) attemptReconnect();
  });
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

  const dx = x - lastX;
  const dz = z - lastZ;
  if (dx * dx + dz * dz < MULTIPLAYER.positionDeltaThreshold * MULTIPLAYER.positionDeltaThreshold) {
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
