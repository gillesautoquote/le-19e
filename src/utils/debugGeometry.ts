/**
 * debugGeometry.ts — Builds line/marker geometries for the road debug overlay.
 * All geometries are lifted Y_LIFT above the surface for visibility.
 */

import { BufferGeometry, Float32BufferAttribute } from 'three';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';
import type { SceneRoad } from '@/types/osm';

const Y_LIFT = 0.5;
const VEHICLE_TYPES = new Set(['primary', 'secondary', 'tertiary', 'residential']);
const SIDEWALK_W: Record<string, number> = {
  primary: 6, secondary: 5, tertiary: 4, residential: 3,
};

function bestY(x: number, z: number): number {
  const g = getRoadGradeHeight(x, z);
  return (g > -Infinity ? g : getTerrainHeight(x, z)) + Y_LIFT;
}

/** Normal perpendicular to segment (ax,az)→(bx,bz). Returns [nx, nz]. */
function segNormal(ax: number, az: number, bx: number, bz: number): [number, number] {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.01) return [0, 0];
  return [-dz / len, dx / len];
}

// ─── Road centerlines (yellow) ──────────────────────────────────

export function buildCenterlineGeometry(roads: SceneRoad[]): BufferGeometry {
  const verts: number[] = [];
  for (const road of roads) {
    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      verts.push(ax, bestY(ax, az), az, bx, bestY(bx, bz), bz);
    }
  }
  const geo = new BufferGeometry();
  if (verts.length > 0) {
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
  }
  return geo;
}

// ─── Road width edges (orange) ──────────────────────────────────

export function buildRoadWidthGeometry(roads: SceneRoad[]): BufferGeometry {
  const verts: number[] = [];
  for (const road of roads) {
    if (!VEHICLE_TYPES.has(road.type)) continue;
    const hw = road.width / 2;
    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const [nx, nz] = segNormal(ax, az, bx, bz);
      const ya = bestY(ax, az);
      const yb = bestY(bx, bz);
      // Left edge
      verts.push(ax + nx * hw, ya, az + nz * hw, bx + nx * hw, yb, bz + nz * hw);
      // Right edge
      verts.push(ax - nx * hw, ya, az - nz * hw, bx - nx * hw, yb, bz - nz * hw);
    }
  }
  const geo = new BufferGeometry();
  if (verts.length > 0) {
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
  }
  return geo;
}

// ─── Sidewalk outer edges (blue) ────────────────────────────────

export function buildSidewalkBoundsGeometry(roads: SceneRoad[]): BufferGeometry {
  const verts: number[] = [];
  for (const road of roads) {
    if (!VEHICLE_TYPES.has(road.type)) continue;
    const sw = SIDEWALK_W[road.type] ?? 0;
    if (sw <= 0) continue;
    const totalHW = road.width / 2 + sw;
    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const [nx, nz] = segNormal(ax, az, bx, bz);
      const ya = bestY(ax, az);
      const yb = bestY(bx, bz);
      verts.push(ax + nx * totalHW, ya, az + nz * totalHW, bx + nx * totalHW, yb, bz + nz * totalHW);
      verts.push(ax - nx * totalHW, ya, az - nz * totalHW, bx - nx * totalHW, yb, bz - nz * totalHW);
    }
  }
  const geo = new BufferGeometry();
  if (verts.length > 0) {
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
  }
  return geo;
}

// ─── Grade profile lines (green continuous lines) ────────────────

export function buildGradeMarkerGeometry(roads: SceneRoad[]): BufferGeometry | null {
  const verts: number[] = [];
  const sampleStep = 5;
  for (const road of roads) {
    if (!VEHICLE_TYPES.has(road.type)) continue;
    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const dx = bx - ax;
      const dz = bz - az;
      const len = Math.sqrt(dx * dx + dz * dz);
      const steps = Math.max(1, Math.ceil(len / sampleStep));
      for (let s = 0; s < steps; s++) {
        const t0 = s / steps;
        const t1 = (s + 1) / steps;
        const x0 = ax + dx * t0;
        const z0 = az + dz * t0;
        const x1 = ax + dx * t1;
        const z1 = az + dz * t1;
        verts.push(x0, bestY(x0, z0), z0, x1, bestY(x1, z1), z1);
      }
    }
  }
  if (verts.length === 0) return null;
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
  return geo;
}

// ─── Tile grid outlines (magenta rectangles at tile boundaries) ──

export function buildTileGridGeometry(
  tileKeys: string[],
  tileSize: number,
): BufferGeometry {
  const verts: number[] = [];
  const y = Y_LIFT + 0.5;

  for (const key of tileKeys) {
    const [rowStr, colStr] = key.split('_');
    const row = Number(rowStr);
    const col = Number(colStr);

    const x0 = col * tileSize;
    const z0 = row * tileSize;
    const x1 = x0 + tileSize;
    const z1 = z0 + tileSize;

    // Four edges of the tile rectangle
    verts.push(x0, y, z0, x1, y, z0); // bottom
    verts.push(x1, y, z0, x1, y, z1); // right
    verts.push(x1, y, z1, x0, y, z1); // top
    verts.push(x0, y, z1, x0, y, z0); // left
  }

  const geo = new BufferGeometry();
  if (verts.length > 0) {
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
  }
  return geo;
}

// ─── Road info summary for the debug panel ──────────────────────

export interface RoadDebugInfo {
  totalRoads: number;
  vehicleRoads: number;
  totalLength: number;
  types: Record<string, number>;
  widths: Record<string, number>;
}

export function computeRoadDebugInfo(roads: SceneRoad[]): RoadDebugInfo {
  const types: Record<string, number> = {};
  const widths: Record<string, number> = {};
  let totalLength = 0;
  let vehicleRoads = 0;

  for (const road of roads) {
    types[road.type] = (types[road.type] ?? 0) + 1;
    const wKey = `${road.width.toFixed(1)}m`;
    widths[wKey] = (widths[wKey] ?? 0) + 1;
    if (VEHICLE_TYPES.has(road.type)) vehicleRoads++;

    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0];
      const dz = pts[i + 1][1] - pts[i][1];
      totalLength += Math.sqrt(dx * dx + dz * dz);
    }
  }

  return { totalRoads: roads.length, vehicleRoads, totalLength, types, widths };
}
