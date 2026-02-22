/**
 * quayGeometry.ts — Build vertical quay wall geometry along waterway edges.
 *
 * Creates stone walls from water surface (WORLD.waterY) up to terrain height
 * on both sides of each waterway.
 */

import { BufferGeometry, Float32BufferAttribute } from 'three';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { WORLD } from '@/constants/world';
import type { SceneWater } from '@/types/osm';

/** Max distance between edge subdivision points (meters). */
const EDGE_SUBDIVIDE = 10;

/** Minimum wall height to create geometry (meters). */
const MIN_WALL_HEIGHT = 0.1;

// ─── Edge polyline computation ──────────────────────────────────────

interface EdgePoint {
  x: number;
  z: number;
}

/**
 * Compute left and right edge polylines from a waterway centerline.
 * Same perpendicular-offset algorithm as ribbonGeometry.
 */
function computeEdgePolylines(
  pts: [number, number][],
  halfWidth: number,
): { left: EdgePoint[]; right: EdgePoint[] } {
  const left: EdgePoint[] = [];
  const right: EdgePoint[] = [];

  for (let i = 0; i < pts.length; i++) {
    let dx = 0;
    let dz = 0;

    if (i === 0) {
      dx = pts[1][0] - pts[0][0];
      dz = pts[1][1] - pts[0][1];
    } else if (i === pts.length - 1) {
      dx = pts[i][0] - pts[i - 1][0];
      dz = pts[i][1] - pts[i - 1][1];
    } else {
      const fx = pts[i + 1][0] - pts[i][0];
      const fz = pts[i + 1][1] - pts[i][1];
      const fl = Math.sqrt(fx * fx + fz * fz);
      const bx = pts[i][0] - pts[i - 1][0];
      const bz = pts[i][1] - pts[i - 1][1];
      const bl = Math.sqrt(bx * bx + bz * bz);
      if (fl > 0.001) { dx += fx / fl; dz += fz / fl; }
      if (bl > 0.001) { dx += bx / bl; dz += bz / bl; }
    }

    const len = Math.sqrt(dx * dx + dz * dz);
    if (len === 0) continue;

    const nx = -dz / len;
    const nz = dx / len;

    left.push({ x: pts[i][0] + nx * halfWidth, z: pts[i][1] + nz * halfWidth });
    right.push({ x: pts[i][0] - nx * halfWidth, z: pts[i][1] - nz * halfWidth });
  }

  return { left, right };
}

// ─── Edge subdivision ───────────────────────────────────────────────

function subdivideEdge(edge: EdgePoint[]): EdgePoint[] {
  if (edge.length < 2) return edge;
  const out: EdgePoint[] = [edge[0]];
  for (let i = 1; i < edge.length; i++) {
    const dx = edge[i].x - edge[i - 1].x;
    const dz = edge[i].z - edge[i - 1].z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.ceil(len / EDGE_SUBDIVIDE);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push({
        x: edge[i - 1].x + dx * t,
        z: edge[i - 1].z + dz * t,
      });
    }
  }
  return out;
}

// ─── Wall strip builder ─────────────────────────────────────────────

/**
 * Build vertical wall quads along one edge polyline.
 * Bottom at WORLD.waterY, top at terrain height.
 */
function buildWallStrip(
  edge: EdgePoint[],
  verts: number[],
  indices: number[],
  baseIndex: number,
): number {
  const botY = WORLD.waterY;
  let idx = baseIndex;

  for (let i = 0; i < edge.length; i++) {
    const { x, z } = edge[i];
    const topY = getTerrainHeight(x, z);

    // Top vertex, then bottom vertex
    verts.push(x, topY, z);
    verts.push(x, botY, z);

    if (i > 0) {
      const prev = idx - 2;
      const curr = idx;
      // Only create quad if wall is tall enough at either end
      const prevTopY = verts[prev * 3 + 1];
      if (prevTopY - botY > MIN_WALL_HEIGHT || topY - botY > MIN_WALL_HEIGHT) {
        indices.push(prev, prev + 1, curr);
        indices.push(prev + 1, curr + 1, curr);
      }
    }
    idx += 2;
  }

  return idx;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Build merged quay wall geometry for all waterways.
 * Returns null if no waterways have edges above water level.
 */
export function buildQuayWallGeometry(waterways: SceneWater[]): BufferGeometry | null {
  const verts: number[] = [];
  const indices: number[] = [];
  let baseIndex = 0;

  for (const waterway of waterways) {
    if (waterway.points.length < 2) continue;
    const halfW = waterway.width / 2;

    const { left, right } = computeEdgePolylines(waterway.points, halfW);
    const leftSub = subdivideEdge(left);
    const rightSub = subdivideEdge(right);

    baseIndex = buildWallStrip(leftSub, verts, indices, baseIndex);
    baseIndex = buildWallStrip(rightSub, verts, indices, baseIndex);
  }

  if (verts.length === 0 || indices.length === 0) return null;

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(verts, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
