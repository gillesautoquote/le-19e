/**
 * npcRoutes.ts — Route building and sampling utilities for NPCs.
 *
 * Pure functions: build a RouteSegment from polyline points,
 * then sample position/rotation at any distance along the route.
 */
import type { RouteSegment, AnimatedCar, RouteEndpoints } from '@/types/npc';

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

// ─── Route graph (intersection connectivity) ────────────────────

const CONNECT_THRESHOLD_SQ = 5 * 5; // 5m threshold for endpoint matching

/** Build adjacency graph connecting routes at shared endpoints. */
export function buildRouteGraph(routes: RouteSegment[]): RouteEndpoints[] {
  const graph: RouteEndpoints[] = routes.map(() => ({ atStart: [], atEnd: [] }));
  const T = CONNECT_THRESHOLD_SQ;
  for (let i = 0; i < routes.length; i++) {
    const pi = routes[i].points;
    const [iS, iE] = [pi[0], pi[pi.length - 1]];
    for (let j = 0; j < routes.length; j++) {
      if (i === j) continue;
      const pj = routes[j].points;
      const [jS, jE] = [pj[0], pj[pj.length - 1]];
      const ow = routes[j].oneway;
      if (distSq(iE[0], iE[1], jS[0], jS[1]) < T)
        graph[i].atEnd.push({ targetRoute: j, enterAtStart: true });
      if (!ow && distSq(iE[0], iE[1], jE[0], jE[1]) < T)
        graph[i].atEnd.push({ targetRoute: j, enterAtStart: false });
      if (!ow && distSq(iS[0], iS[1], jE[0], jE[1]) < T)
        graph[i].atStart.push({ targetRoute: j, enterAtStart: false });
      if (distSq(iS[0], iS[1], jS[0], jS[1]) < T)
        graph[i].atStart.push({ targetRoute: j, enterAtStart: true });
    }
  }
  return graph;
}

// ─── Car lane offset ────────────────────────────────────────────

/** Compute perpendicular lane offset for a car on a given route. */
export function computeLaneOffset(
  route: RouteSegment, direction: 1 | -1, seed: number,
): number {
  if (route.oneway) {
    // One-way: right side with lane variation
    return -route.width * (seededRandom(seed) > 0.5 ? 0.15 : 0.30);
  }
  // Two-way: right side for each direction (France = drive right)
  return -direction * route.width * 0.25;
}

// ─── Route transition at endpoints ──────────────────────────────

/** Attempt to transition a car to a connected route. Returns true on success. */
export function transitionCar(
  car: AnimatedCar,
  routes: RouteSegment[],
  graph: RouteEndpoints[],
): boolean {
  const endpoints = graph[car.routeIndex];
  if (!endpoints) return false;
  const connections = car.direction === 1 ? endpoints.atEnd : endpoints.atStart;
  if (connections.length === 0) return false;

  const idx = Math.floor(seededRandom(car.x * 127.3 + car.z * 311.7) * connections.length);
  const conn = connections[idx];
  const newRoute = routes[conn.targetRoute];
  if (!newRoute) return false;

  car.routeIndex = conn.targetRoute;
  car.direction = conn.enterAtStart ? 1 : -1;
  car.progress = conn.enterAtStart ? 0.5 : newRoute.totalLength - 0.5;
  car.laneOffset = computeLaneOffset(newRoute, car.direction, car.x * 1000 + car.z);
  return true;
}

// ─── Following distance enforcement ─────────────────────────────

/** Prevent cars on same route+direction from overlapping. */
export function enforceFollowingDistance(
  cars: AnimatedCar[], routes: RouteSegment[], followDist: number,
): void {
  const groups = new Map<number, number[]>();
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    if (!c.alive) continue;
    const key = c.routeIndex * 2 + (c.direction === 1 ? 0 : 1);
    let arr = groups.get(key);
    if (!arr) { arr = []; groups.set(key, arr); }
    arr.push(i);
  }

  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    const dir = cars[indices[0]].direction;
    // Sort so leader is last
    indices.sort((a, b) => (cars[a].progress - cars[b].progress) * dir);
    for (let k = indices.length - 2; k >= 0; k--) {
      const follower = cars[indices[k]];
      const leader = cars[indices[k + 1]];
      const gap = (leader.progress - follower.progress) * dir;
      if (gap < followDist) {
        follower.progress = leader.progress - followDist * dir;
        follower.speed = Math.min(follower.speed, leader.speed);
        const route = routes[follower.routeIndex];
        if (route && follower.progress >= 0 && follower.progress <= route.totalLength) {
          const s = sampleRouteOffset(route, follower.progress, follower.laneOffset);
          follower.x = s.x; follower.z = s.z;
        } else {
          follower.alive = false;
        }
      }
    }
  }
}
