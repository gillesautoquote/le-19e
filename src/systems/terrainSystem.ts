/**
 * terrainSystem.ts — Heightmap loader + fast terrain height lookup.
 *
 * Stores heightmap data at module level (not Zustand) because the
 * Float32Array is too large for devtools serialization.
 *
 * Call loadHeightmap() once during app startup, then use
 * getTerrainHeight(x, z) from any system or component.
 */

import { WORLD } from '@/constants/world';

// ─── Types ───────────────────────────────────────────────────────

export interface HeightmapMeta {
  cols: number;
  rows: number;
  cellSize: number;
  originX: number;
  originZ: number;
  refAltitude: number;
  minElevation: number;
  maxElevation: number;
}

// ─── Module-level state ──────────────────────────────────────────

let heightData: Float32Array | null = null;
let meta: HeightmapMeta | null = null;

// Precomputed terrain mesh grid (set after load)
let meshSegsX = 0;
let meshSegsZ = 0;
let meshWidthM = 0;
let meshDepthM = 0;

// ─── Public API ──────────────────────────────────────────────────

const HEIGHTMAP_BASE = '/data/heightmap';

/** Load the binary heightmap + metadata. Call once at startup. */
export async function loadHeightmap(): Promise<void> {
  const [metaRes, binRes] = await Promise.all([
    fetch(`${HEIGHTMAP_BASE}.json`),
    fetch(`${HEIGHTMAP_BASE}.bin`),
  ]);

  if (!metaRes.ok) throw new Error(`Heightmap meta: ${metaRes.status}`);
  if (!binRes.ok) throw new Error(`Heightmap bin: ${binRes.status}`);

  meta = (await metaRes.json()) as HeightmapMeta;
  const buffer = await binRes.arrayBuffer();
  heightData = new Float32Array(buffer);

  const expected = meta.cols * meta.rows;
  if (heightData.length !== expected) {
    throw new Error(
      `Heightmap size mismatch: got ${heightData.length}, expected ${expected}`,
    );
  }

  // Precompute mesh grid dimensions (must match buildTerrainGeometry)
  meshWidthM = (meta.cols - 1) * meta.cellSize;
  meshDepthM = (meta.rows - 1) * meta.cellSize;
  meshSegsX = Math.floor(meshWidthM / WORLD.terrainMeshCellSize);
  meshSegsZ = Math.floor(meshDepthM / WORLD.terrainMeshCellSize);
}

/** Whether the heightmap has been loaded. */
export function isHeightmapLoaded(): boolean {
  return heightData !== null && meta !== null;
}

// ─── Height lookup ──────────────────────────────────────────────

/**
 * Bilinear sample on the raw heightmap grid (10m resolution).
 * Used internally for terrain mesh vertex heights.
 */
function rawBilinear(sceneX: number, sceneZ: number): number {
  if (!heightData || !meta) return 0;

  const gx = (sceneX - meta.originX) / meta.cellSize;
  const gz = (sceneZ - meta.originZ) / meta.cellSize;

  if (gx < 0 || gz < 0 || gx >= meta.cols - 1 || gz >= meta.rows - 1) {
    return 0;
  }

  const c0 = Math.floor(gx);
  const r0 = Math.floor(gz);
  const tx = gx - c0;
  const tz = gz - r0;

  const i00 = r0 * meta.cols + c0;
  const top = heightData[i00] * (1 - tx) + heightData[i00 + 1] * tx;
  const bot = heightData[i00 + meta.cols] * (1 - tx) + heightData[i00 + meta.cols + 1] * tx;
  return top * (1 - tz) + bot * tz;
}

/**
 * Terrain height at scene position (x, z).
 *
 * Uses **triangle interpolation** matching the GPU terrain mesh exactly.
 * buildTerrainGeometry splits each quad into two triangles via diagonal
 * (0,1)→(1,0). This function reproduces that interpolation so objects
 * sit perfectly on the rendered surface.
 *
 * Returns 0 if heightmap is not loaded or position is outside coverage.
 */
export function getTerrainHeight(sceneX: number, sceneZ: number): number {
  if (!heightData || !meta || meshSegsX === 0) return 0;

  // Position in mesh grid space (0 → segsX/Z)
  const gx = ((sceneX - meta.originX) / meshWidthM) * meshSegsX;
  const gz = ((sceneZ - meta.originZ) / meshDepthM) * meshSegsZ;

  if (gx < 0 || gz < 0 || gx >= meshSegsX || gz >= meshSegsZ) return 0;

  const ix = Math.floor(gx);
  const iz = Math.floor(gz);
  const tx = gx - ix;
  const tz = gz - iz;

  // Scene positions of the 4 mesh quad corners
  const sx0 = meta.originX + (ix / meshSegsX) * meshWidthM;
  const sx1 = meta.originX + ((ix + 1) / meshSegsX) * meshWidthM;
  const sz0 = meta.originZ + (iz / meshSegsZ) * meshDepthM;
  const sz1 = meta.originZ + ((iz + 1) / meshSegsZ) * meshDepthM;

  // Heights at quad corners (raw heightmap bilinear → exact at mesh vertices)
  const h00 = rawBilinear(sx0, sz0);
  const h10 = rawBilinear(sx1, sz0);
  const h01 = rawBilinear(sx0, sz1);
  const h11 = rawBilinear(sx1, sz1);

  // Triangle interpolation matching buildTerrainGeometry:
  // indices.push(a, c, b, b, c, d)  →  diagonal from (0,1) to (1,0)
  if (tx + tz <= 1) {
    // Triangle 1: a(0,0), c(0,1), b(1,0)
    return h00 + tx * (h10 - h00) + tz * (h01 - h00);
  }
  // Triangle 2: b(1,0), c(0,1), d(1,1)
  return h11 + (1 - tx) * (h01 - h11) + (1 - tz) * (h10 - h11);
}

/**
 * Expose raw heightmap data for mesh generation (terrainGeometry).
 * Returns null if not yet loaded.
 */
export function getHeightmapData(): {
  data: Float32Array;
  meta: HeightmapMeta;
} | null {
  if (!heightData || !meta) return null;
  return { data: heightData, meta };
}
