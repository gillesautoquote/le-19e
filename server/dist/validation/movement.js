"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMovement = validateMovement;
exports.rateLimitOk = rateLimitOk;
exports.rateLimitCleanup = rateLimitCleanup;
exports.sanitize = sanitize;
/** Maximum teleport distance between two position updates (units) */
const MAX_TELEPORT = 100;
/**
 * Validates that a position update is plausible.
 * Rejects teleportation attempts (distance > MAX_TELEPORT).
 */
function validateMovement(player, data) {
    if (typeof data.x !== 'number' || typeof data.z !== 'number')
        return false;
    if (typeof data.rotation !== 'number' || typeof data.anim !== 'number')
        return false;
    if (!isFinite(data.x) || !isFinite(data.z) || !isFinite(data.rotation))
        return false;
    const dx = data.x - player.x;
    const dz = data.z - player.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > MAX_TELEPORT)
        return false;
    return true;
}
/** Simple chat rate limiter: tracks message timestamps per client */
const rateLimitMap = new Map();
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_MESSAGES = 5;
function rateLimitOk(clientId) {
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
    if (timestamps.length >= RATE_MAX_MESSAGES)
        return false;
    timestamps.push(now);
    return true;
}
/** Remove rate limit data for a disconnected client */
function rateLimitCleanup(clientId) {
    rateLimitMap.delete(clientId);
}
/** Basic HTML sanitization to prevent XSS in chat messages and names */
function sanitize(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
