/**
 * terrainGeometry.ts — Builds a subdivided plane with vertex displacement
 * from the heightmap. Provides a BufferGeometry for the terrain mesh.
 */

import {
  BufferGeometry,
  Float32BufferAttribute,
  Color,
} from 'three';
import { EPOCH_A } from '@/constants/epochs';
import { WORLD } from '@/constants/world';
import { getRoadTerrainBlend } from '@/systems/roadGradeSystem';
import type { HeightmapMeta } from '@/systems/terrainSystem';
import type { SceneWater } from '@/types/osm';

/** Depth to carve below the DEM surface for waterway beds (meters).
 *  Matches WORLD.canalBedDepth so terrain doesn't poke through the canal floor. */
const CANAL_BED_DEPTH = WORLD.canalBedDepth;

/**
 * Build a terrain BufferGeometry by sampling the heightmap grid.
 * Optionally depresses vertices under waterway areas to create canal beds.
 *
 * @param heightData - Raw Float32Array of elevations
 * @param meta       - Heightmap metadata (cols, rows, cellSize, origin, etc.)
 * @param meshCell   - Spacing between terrain mesh vertices (in meters)
 * @param waterways  - Optional waterway data for canal bed depression
 */
export function buildTerrainGeometry(
  heightData: Float32Array,
  meta: HeightmapMeta,
  meshCell: number,
  waterways?: SceneWater[],
  groundColorHex?: string,
  highColorHex?: string,
): BufferGeometry {
  // Determine mesh grid dimensions from heightmap bounds
  const widthM = (meta.cols - 1) * meta.cellSize;
  const depthM = (meta.rows - 1) * meta.cellSize;
  const segsX = Math.floor(widthM / meshCell);
  const segsZ = Math.floor(depthM / meshCell);
  const vertsX = segsX + 1;
  const vertsZ = segsZ + 1;

  const positions = new Float32Array(vertsX * vertsZ * 3);
  const colors = new Float32Array(vertsX * vertsZ * 3);
  const groundColor = new Color(groundColorHex ?? EPOCH_A.ground);
  const highColor = new Color(highColorHex ?? EPOCH_A.terrainHigh);
  const tmpColor = new Color();

  // Height range for color interpolation
  const elevRange = Math.max(1, meta.maxElevation - meta.minElevation);

  for (let rz = 0; rz < vertsZ; rz++) {
    for (let rx = 0; rx < vertsX; rx++) {
      const idx = rz * vertsX + rx;
      const i3 = idx * 3;

      // Scene-space position of this vertex
      const sx = meta.originX + (rx / segsX) * widthM;
      const sz = meta.originZ + (rz / segsZ) * depthM;

      // Sample height via bilinear interpolation on the data grid
      const y = sampleHeightmap(heightData, meta, sx, sz);

      // Depress terrain under waterways to create canal beds
      const depression = waterways ? getWaterwayDepression(sx, sz, waterways) : 0;
      let finalY = y - depression;

      // Depress terrain under roads so it never pokes through the road surface
      const roadBlend = getRoadTerrainBlend(sx, sz);
      if (roadBlend && roadBlend.blend > 0 && finalY > roadBlend.targetY) {
        finalY = finalY * (1 - roadBlend.blend) + roadBlend.targetY * roadBlend.blend;
      }

      positions[i3] = sx;
      positions[i3 + 1] = finalY;
      positions[i3 + 2] = sz;

      // Vertex color: blend ground → terrainHigh based on elevation
      const colorY = depression > 0 ? y : y; // Use un-depressed for color
      const t = Math.max(0, Math.min(1, (colorY - meta.minElevation) / elevRange));
      tmpColor.copy(groundColor).lerp(highColor, t);
      colors[i3] = tmpColor.r;
      colors[i3 + 1] = tmpColor.g;
      colors[i3 + 2] = tmpColor.b;
    }
  }

  // Build triangle indices
  const indices: number[] = [];
  for (let rz = 0; rz < segsZ; rz++) {
    for (let rx = 0; rx < segsX; rx++) {
      const a = rz * vertsX + rx;
      const b = a + 1;
      const c = a + vertsX;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── Waterway depression ─────────────────────────────────────────

/** Squared distance from point (px,pz) to line segment (ax,az)→(bx,bz). */
function ptSegDistSq(
  px: number, pz: number,
  ax: number, az: number,
  bx: number, bz: number,
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.001) return (px - ax) ** 2 + (pz - az) ** 2;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq));
  const cx = ax + t * dx;
  const cz = az + t * dz;
  return (px - cx) ** 2 + (pz - cz) ** 2;
}

/** Extra meters beyond walkway edge where terrain smoothly transitions. */
const DEPRESSION_FALLOFF = 10;

/**
 * Compute terrain depression at a point near waterways.
 *
 * - Within canal + walkway zone: full depression (terrain hidden by canal geometry)
 * - Beyond that + falloff margin: smooth quadratic transition back to 0
 *
 * This prevents coarse terrain mesh (20m cells) from poking through the canal.
 */
function getWaterwayDepression(
  sx: number,
  sz: number,
  waterways: SceneWater[],
): number {
  let minDistSq = Infinity;
  let matchedHalfW = 0;

  for (const ww of waterways) {
    const pts = ww.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const dSq = ptSegDistSq(sx, sz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        matchedHalfW = ww.width / 2;
      }
    }
  }

  if (minDistSq === Infinity) return 0;

  const fullRadius = matchedHalfW + WORLD.canalWalkwayWidth;
  const outerRadius = fullRadius + DEPRESSION_FALLOFF;

  if (minDistSq >= outerRadius * outerRadius) return 0;

  const dist = Math.sqrt(minDistSq);
  if (dist <= fullRadius) return CANAL_BED_DEPTH;

  // Smooth quadratic falloff in the transition zone
  const t = (dist - fullRadius) / DEPRESSION_FALLOFF;
  return CANAL_BED_DEPTH * (1 - t * t);
}

// ─── Helper ──────────────────────────────────────────────────────

/** Bilinear sample from the raw heightmap Float32Array. */
function sampleHeightmap(
  data: Float32Array,
  meta: HeightmapMeta,
  sceneX: number,
  sceneZ: number,
): number {
  const gx = (sceneX - meta.originX) / meta.cellSize;
  const gz = (sceneZ - meta.originZ) / meta.cellSize;

  if (gx < 0 || gz < 0 || gx >= meta.cols - 1 || gz >= meta.rows - 1) {
    return 0;
  }

  const c0 = Math.floor(gx);
  const r0 = Math.floor(gz);
  const tx = gx - c0;
  const ty = gz - r0;

  const i00 = r0 * meta.cols + c0;
  const top = data[i00] * (1 - tx) + data[i00 + 1] * tx;
  const bot = data[i00 + meta.cols] * (1 - tx) + data[i00 + meta.cols + 1] * tx;
  return top * (1 - ty) + bot * ty;
}
