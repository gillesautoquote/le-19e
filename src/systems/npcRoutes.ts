/**
 * npcRoutes.ts — Route building and sampling utilities for NPCs.
 *
 * Pure functions: build a RouteSegment from polyline points,
 * then sample position/rotation at any distance along the route.
 */
import type { RouteSegment } from '@/types/npc';

// ─── Route building ─────────────────────────────────────────────

/** Precompute cumulative distances for efficient sampling. */
export function buildRoute(
  points: [number, number][],
  width = 0,
  oneway = false,
): RouteSegment {
  const segmentLengths: number[] = [];
  const cumulativeLengths: number[] = [0];
  let total = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    const dz = points[i + 1][1] - points[i][1];
    const len = Math.sqrt(dx * dx + dz * dz);
    segmentLengths.push(len);
    total += len;
    cumulativeLengths.push(total);
  }

  return { points, totalLength: total, segmentLengths, cumulativeLengths, width, oneway };
}

/** Binary search for interpolated position along route. O(log n). */
export function sampleRoute(
  route: RouteSegment,
  progress: number,
): { x: number; z: number; rotationY: number } {
  const clamped = Math.max(0, Math.min(progress, route.totalLength));
  const cum = route.cumulativeLengths;

  let lo = 0;
  let hi = cum.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid] <= clamped) lo = mid;
    else hi = mid - 1;
  }

  const segStart = cum[lo];
  const segLen = route.segmentLengths[lo];
  const t = segLen > 0.001 ? (clamped - segStart) / segLen : 0;

  const p0 = route.points[lo];
  const p1 = route.points[lo + 1];
  const x = p0[0] + (p1[0] - p0[0]) * t;
  const z = p0[1] + (p1[1] - p0[1]) * t;
  const rotationY = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);

  return { x, z, rotationY };
}

/** Sample route position offset to one side by `offset` meters. */
export function sampleRouteOffset(
  route: RouteSegment,
  progress: number,
  offset: number,
): { x: number; z: number; rotationY: number } {
  const s = sampleRoute(route, progress);
  if (Math.abs(offset) < 0.01) return s;

  // Compute perpendicular from the route direction
  const clamped = Math.max(0, Math.min(progress, route.totalLength));
  const cum = route.cumulativeLengths;
  let lo = 0;
  let hi = cum.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cum[mid] <= clamped) lo = mid;
    else hi = mid - 1;
  }
  const p0 = route.points[lo];
  const p1 = route.points[lo + 1];
  const dx = p1[0] - p0[0];
  const dz = p1[1] - p0[1];
  const segLen = route.segmentLengths[lo];
  if (segLen < 0.001) return s;

  // Perpendicular (rotate direction 90 degrees)
  const nx = -dz / segLen;
  const nz = dx / segLen;

  return {
    x: s.x + nx * offset,
    z: s.z + nz * offset,
    rotationY: s.rotationY,
  };
}

// ─── Seeded pseudo-random ───────────────────────────────────────

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function randomRange(min: number, max: number, seed: number): number {
  return min + seededRandom(seed) * (max - min);
}

// ─── Distance ───────────────────────────────────────────────────

export function distSq(
  x1: number, z1: number,
  x2: number, z2: number,
): number {
  const dx = x1 - x2;
  const dz = z1 - z2;
  return dx * dx + dz * dz;
}

/** Find index of first route whose midpoint is within radius of player. */
export function routeNearPlayer(
  routes: RouteSegment[],
  px: number,
  pz: number,
  radius: number,
): number {
  const r2 = radius * radius;
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const mid = route.totalLength * 0.5;
    const s = sampleRoute(route, mid);
    if (distSq(s.x, s.z, px, pz) < r2) return i;
  }
  return -1;
}
