/** Remote player data received from the server */
export interface RemotePlayerData {
  id: string;
  name: string;
  x: number;
  z: number;
  rotation: number;
  anim: number; // 0=idle, 1=walk
  epoch: 'A' | 'B';
}

/** Chat message received from the server */
export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  channel: 'global' | 'proximity';
  x: number;
  z: number;
  timestamp: number;
}

/** System message (join/leave) */
export interface SystemMessage {
  type: 'join' | 'leave';
  playerId: string;
  name: string;
  ts: number;
}

/** WebSocket connection status */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Interpolation buffer for smooth remote player movement */
export interface InterpolationBuffer {
  prevX: number;
  prevZ: number;
  prevRotation: number;
  targetX: number;
  targetZ: number;
  targetRotation: number;
  elapsed: number;
  duration: number;
}

/** Position broadcast payload sent to server */
export interface PositionPayload {
  x: number;
  z: number;
  rotation: number;
  anim: number;
}

/** Chat payload sent to server */
export interface ChatPayload {
  text: string;
  channel: 'global' | 'proximity';
}

// ─── Server message types ────────────────────────────────────────

export interface PlayerAddMsg {
  id: string;
  name: string;
  x: number;
  z: number;
  rotation: number;
  anim: number;
  epoch: 'A' | 'B';
}

export interface PlayerMoveMsg {
  id: string;
  x: number;
  z: number;
  rotation: number;
  anim: number;
}

export interface PlayerRemoveMsg {
  id: string;
}

export interface PlayerCountMsg {
  count: number;
}

export interface PlayerEpochMsg {
  id: string;
  epoch: 'A' | 'B';
}

export interface ChatServerMsg {
  playerId: string;
  name: string;
  text: string;
  channel: 'global' | 'proximity';
  x: number;
  z: number;
  ts: number;
}
