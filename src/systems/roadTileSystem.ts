/**
 * roadTileSystem.ts — Surface height grid for player collision with roads.
 *
 * The grid is populated by roadGridSystem.computeRoadGrid() and queried
 * every frame by playerSystem to keep the player walking on road surfaces.
 */

import { GRID_CELL } from '@/constants/kenneyRoads';

// ─── Surface height grid ─────────────────────────────────────────

const _surfGrid = new Map<string, number>();

function cellKey(x: number, z: number): string {
  const cx = Math.round(x / GRID_CELL);
  const cz = Math.round(z / GRID_CELL);
  return `${cx},${cz}`;
}

/** Top-of-surface Y at scene position, or -Infinity if not on a road. */
export function getRoadSurfaceHeight(x: number, z: number): number {
  return _surfGrid.get(cellKey(x, z)) ?? -Infinity;
}

/** Returns the surface grid map so roadGridSystem can populate it. */
export function getSurfaceGrid(): Map<string, number> {
  return _surfGrid;
}
