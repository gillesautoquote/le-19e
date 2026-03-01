import type { PlayerState } from '../schema/GameState.js';

/** Maximum teleport distance between two position updates (units) */
const MAX_TELEPORT = 100;

interface MoveData {
  x: number;
  z: number;
  rotation: number;
  anim: number;
}

/**
 * Validates that a position update is plausible.
 * Rejects teleportation attempts (distance > MAX_TELEPORT).
 */
export function validateMovement(player: PlayerState, data: MoveData): boolean {
  if (typeof data.x !== 'number' || typeof data.z !== 'number') return false;
  if (typeof data.rotation !== 'number' || typeof data.anim !== 'number') return false;
  if (!isFinite(data.x) || !isFinite(data.z) || !isFinite(data.rotation)) return false;

  const dx = data.x - player.x;
  const dz = data.z - player.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist > MAX_TELEPORT) return false;

  return true;
}

/** Simple chat rate limiter: tracks message timestamps per client */
const rateLimitMap = new Map<string, number[]>();
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_MESSAGES = 5;

export function rateLimitOk(clientId: string): boolean {
  const now = Date.now();
  let timestamps = rateLimitMap.get(clientId);

  if (!timestamps) {
    timestamps = [];
    rateLimitMap.set(clientId, timestamps);
  }

  // Remove timestamps outside the window
  while (timestamps.length > 0 && timestamps[0] < now - RATE_WINDOW_MS) {
    timestamps.shift();
  }

  if (timestamps.length >= RATE_MAX_MESSAGES) return false;

  timestamps.push(now);
  return true;
}

/** Remove rate limit data for a disconnected client */
export function rateLimitCleanup(clientId: string): void {
  rateLimitMap.delete(clientId);
}

/** Basic HTML sanitization to prevent XSS in chat messages and names */
export function sanitize(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
