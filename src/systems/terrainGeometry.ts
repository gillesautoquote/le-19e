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
import type { HeightmapMeta } from '@/systems/terrainSystem';

/**
 * Build a terrain BufferGeometry by sampling the heightmap grid.
 *
 * @param heightData - Raw Float32Array of elevations
 * @param meta       - Heightmap metadata (cols, rows, cellSize, origin, etc.)
 * @param meshCell   - Spacing between terrain mesh vertices (in meters)
 */
export function buildTerrainGeometry(
  heightData: Float32Array,
  meta: HeightmapMeta,
  meshCell: number,
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
  const groundColor = new Color(EPOCH_A.ground);
  const highColor = new Color(EPOCH_A.terrainHigh);
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

      positions[i3] = sx;
      positions[i3 + 1] = y;
      positions[i3 + 2] = sz;

      // Vertex color: blend ground → terrainHigh based on elevation
      const t = Math.max(0, Math.min(1, (y - meta.minElevation) / elevRange));
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
