/**
 * roadGradeSystem.ts — Smooth road elevation profiles + terrain depression.
 *
 * 1. Samples terrain height along each road centerline at regular intervals
 * 2. Applies a moving-average to produce a smooth grade (no micro-steps)
 * 3. Fills a spatial grid so that:
 *    - Road tiles, ribbons, sidewalks and furniture use smoothY as their height
 *    - Terrain geometry is DEPRESSED under roads so it never pokes through
 *
 * Call buildRoadGrades(roads) once when road data changes.
 */

import { getTerrainHeight } from '@/systems/terrainSystem';
import type { SceneRoad } from '@/types/osm';

// ─── Constants ──────────────────────────────────────────────────────

/** Distance between centerline sample points (meters). */
const SAMPLE_STEP = 5;

/** Half-window for moving-average smoothing (meters). */
const HALF_WINDOW = 20;

/** Grid cell size for the spatial index (meters). */
const GRID_CELL = 2;

/** Smooth transition zone beyond road+sidewalk edge (meters). */
const EDGE_FALLOFF = 8;

/** Gap between road surface and terrain ceiling (meters).
 *  Terrain is forced to be at most this far below the road grade. */
const ROAD_TERRAIN_GAP = 0.2;

/** Sidewalk widths per road type — mirrors roadTileSystem.ts. */
const SIDEWALK_W: Record<string, number> = {
  primary: 6, secondary: 5, tertiary: 4, residential: 3,
};

// ─── Module state ───────────────────────────────────────────────────

interface GradeCell {
  smoothY: number;
  blend: number; // 1.0 = fully on road, 0→1 in falloff zone
}

const _grid = new Map<string, GradeCell>();
let _built = false;

function cellKey(x: number, z: number): string {
  return `${Math.round(x / GRID_CELL)},${Math.round(z / GRID_CELL)}`;
}

// ─── Sampling & smoothing ───────────────────────────────────────────

interface SamplePoint {
  x: number; z: number;
  dist: number;
  rawY: number; smoothY: number;
  nx: number; nz: number; // perpendicular unit normal
}

/** Sample terrain height at regular intervals along a polyline. */
function sampleCenterline(points: [number, number][]): SamplePoint[] {
  const segLens: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    const dz = points[i + 1][1] - points[i][1];
    const len = Math.sqrt(dx * dx + dz * dz);
    segLens.push(len);
    totalLen += len;
  }
  if (totalLen < 0.5) return [];

  const numSamples = Math.max(2, Math.ceil(totalLen / SAMPLE_STEP) + 1);
  const samples: SamplePoint[] = [];

  for (let s = 0; s < numSamples; s++) {
    const dist = (s / (numSamples - 1)) * totalLen;

    // Find which segment this distance falls on
    let cumLen = 0;
    let si = 0;
    while (si < segLens.length - 1 && cumLen + segLens[si] < dist) {
      cumLen += segLens[si];
      si++;
    }
    const sl = segLens[si];
    const t = sl > 0.01 ? Math.min(1, (dist - cumLen) / sl) : 0;

    const p0 = points[si];
    const p1 = points[si + 1];
    const x = p0[0] + (p1[0] - p0[0]) * t;
    const z = p0[1] + (p1[1] - p0[1]) * t;

    const dx = p1[0] - p0[0];
    const dz = p1[1] - p0[1];
    const len = Math.sqrt(dx * dx + dz * dz);
    const nx = len > 0.01 ? -dz / len : 0;
    const nz = len > 0.01 ? dx / len : 0;

    samples.push({ x, z, dist, rawY: getTerrainHeight(x, z), smoothY: 0, nx, nz });
  }
  return samples;
}

/** Moving-average smoothing on rawY values. O(n) sliding window. */
function smoothSamples(samples: SamplePoint[]): void {
  const n = samples.length;
  if (n === 0) return;
  let lo = 0;
  let hi = 0;
  let sum = 0;
  let count = 0;

  for (let i = 0; i < n; i++) {
    const center = samples[i].dist;
    while (hi < n && samples[hi].dist <= center + HALF_WINDOW) {
      sum += samples[hi].rawY;
      count++;
      hi++;
    }
    while (lo < i && samples[lo].dist < center - HALF_WINDOW) {
      sum -= samples[lo].rawY;
      count--;
      lo++;
    }
    samples[i].smoothY = count > 0 ? sum / count : samples[i].rawY;
  }
}

// ─── Spatial grid filling ───────────────────────────────────────────

/** Fill the spatial grid perpendicular to the road including falloff zone. */
function fillGrid(samples: SamplePoint[], halfW: number, swW: number): void {
  const roadExtent = halfW + swW;
  const totalExtent = roadExtent + EDGE_FALLOFF;
  const steps = Math.ceil(totalExtent / GRID_CELL);

  for (const s of samples) {
    for (let k = -steps; k <= steps; k++) {
      const lateralDist = Math.abs(k) * GRID_CELL;
      if (lateralDist > totalExtent) continue;

      let blend: number;
      if (lateralDist <= roadExtent) {
        blend = 1.0;
      } else {
        const t = (lateralDist - roadExtent) / EDGE_FALLOFF;
        blend = 1.0 - t * t;
      }
      if (blend <= 0) continue;

      const gx = s.x + s.nx * k * GRID_CELL;
      const gz = s.z + s.nz * k * GRID_CELL;
      const key = cellKey(gx, gz);
      const existing = _grid.get(key);
      if (!existing || blend > existing.blend) {
        _grid.set(key, { smoothY: s.smoothY, blend });
      }
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────

/** Build smoothed road grades. Call once when road data changes. */
export function buildRoadGrades(roads: SceneRoad[]): void {
  _grid.clear();
  const sorted = [...roads].sort((a, b) => b.width - a.width);

  for (const road of sorted) {
    if (road.points.length < 2) continue;
    const samples = sampleCenterline(road.points);
    if (samples.length < 2) continue;
    smoothSamples(samples);
    fillGrid(samples, road.width / 2, SIDEWALK_W[road.type] ?? 0);
  }
  _built = true;
}

/** Smoothed road surface height, or -Infinity if not on a road corridor. */
export function getRoadGradeHeight(x: number, z: number): number {
  if (!_built) return -Infinity;
  const cell = _grid.get(cellKey(x, z));
  return cell ? cell.smoothY : -Infinity;
}

/**
 * Terrain depression query for buildTerrainGeometry.
 * Returns the target Y the terrain should be clamped to, and a blend [0..1].
 * null if point is not near any road.
 */
export function getRoadTerrainBlend(
  x: number, z: number,
): { targetY: number; blend: number } | null {
  if (!_built) return null;
  const cell = _grid.get(cellKey(x, z));
  if (!cell || cell.blend <= 0) return null;
  return { targetY: cell.smoothY - ROAD_TERRAIN_GAP, blend: cell.blend };
}

/** Whether grades have been built at least once. */
export function isRoadGradeReady(): boolean {
  return _built;
}
