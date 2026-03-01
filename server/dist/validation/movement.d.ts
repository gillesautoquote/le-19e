import type { PlayerState } from '../schema/GameState.js';
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
export declare function validateMovement(player: PlayerState, data: MoveData): boolean;
export declare function rateLimitOk(clientId: string): boolean;
/** Remove rate limit data for a disconnected client */
export declare function rateLimitCleanup(clientId: string): void;
/** Basic HTML sanitization to prevent XSS in chat messages and names */
export declare function sanitize(text: string): string;
export {};
