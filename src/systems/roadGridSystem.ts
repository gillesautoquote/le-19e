/**
 * roadGridSystem.ts — Grid-based road tiling using KayKit road tiles.
 *
 * Rasterises OSM road polylines onto a 2D grid, analyses neighbours to
 * pick the correct tile variant (straight / corner / tsplit / junction),
 * and generates per-tile instances for InstancedMesh rendering.
 */

import { GRID_CELL } from '@/constants/kenneyRoads';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';
import type { SceneRoad } from '@/types/osm';

// ─── Constants ───────────────────────────────────────────────────

const VEHICLE_TYPES: ReadonlySet<string> = new Set([
  'primary', 'secondary', 'tertiary', 'residential',
]);

/** Surface Y offset to prevent z-fighting with terrain. */
const Y_OFFSET = 0.02;
/** Thickness of road tile top surface (for player collision). */
const TILE_TOP = 0.10;
/** Replace a straight tile with a crossing every N cells. */
const CROSSING_INTERVAL = 40;

// ─── Neighbour bitmask (N=1, E=2, S=4, W=8) ────────────────────

const N = 1;
const E = 2;
const S = 4;
const W = 8;

type TileType =
  | 'road_straight'
  | 'road_crossing'
  | 'road_corner'
  | 'road_tsplit'
  | 'road_junction';

interface LookupEntry {
  tile: TileType;
  rot: number;
}

const HP = Math.PI / 2;
const PI = Math.PI;
const HP3 = Math.PI * 1.5;

/** 16-entry lookup: neighbour bitmask → tile type + rotation. */
const LOOKUP: LookupEntry[] = [
  /* 0  ---- */ { tile: 'road_straight', rot: 0 },
  /* 1  N    */ { tile: 'road_straight', rot: 0 },
  /* 2  E    */ { tile: 'road_straight', rot: HP },
  /* 3  NE   */ { tile: 'road_corner',  rot: HP },
  /* 4  S    */ { tile: 'road_straight', rot: 0 },
  /* 5  NS   */ { tile: 'road_straight', rot: 0 },
  /* 6  ES   */ { tile: 'road_corner',  rot: PI },
  /* 7  NES  */ { tile: 'road_tsplit',  rot: HP },
  /* 8  W    */ { tile: 'road_straight', rot: HP },
  /* 9  NW   */ { tile: 'road_corner',  rot: 0 },
  /* 10 EW   */ { tile: 'road_straight', rot: HP },
  /* 11 NEW  */ { tile: 'road_tsplit',  rot: 0 },
  /* 12 SW   */ { tile: 'road_corner',  rot: HP3 },
  /* 13 NSW  */ { tile: 'road_tsplit',  rot: HP3 },
  /* 14 ESW  */ { tile: 'road_tsplit',  rot: PI },
  /* 15 NESW */ { tile: 'road_junction', rot: 0 },
];

// ─── Public types ────────────────────────────────────────────────

export interface GridTileInstance {
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

export interface RoadGridResult {
  /** Map from tile def key to positioned instances. */
  tileGroups: Map<string, GridTileInstance[]>;
  /** Sidewalk tile instances. */
  sidewalks: GridTileInstance[];
}

// ─── Helpers ─────────────────────────────────────────────────────

function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

function worldToGrid(x: number, z: number): [number, number] {
  return [Math.round(x / GRID_CELL), Math.round(z / GRID_CELL)];
}

function gridToWorld(col: number, row: number): [number, number] {
  return [col * GRID_CELL, row * GRID_CELL];
}

function bestY(x: number, z: number): number {
  const g = getRoadGradeHeight(x, z);
  return (g > -Infinity ? g : getTerrainHeight(x, z)) + Y_OFFSET;
}

// ─── Step 1: Rasterise road bands (thick line fill) ─────────────

/**
 * Fill all grid cells within a road-width band along a segment.
 * Samples along the segment and perpendicular at sub-cell resolution
 * to ensure solid, gap-free coverage with proper 4-connectivity.
 */
function rasteriseThickSegment(
  ax: number, az: number,
  bx: number, bz: number,
  halfWidth: number,
  out: Set<string>,
): void {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.01) return;

  const ux = dx / len;
  const uz = dz / len;
  const nx = -uz;
  const nz = ux;

  // Sub-cell stepping to avoid gaps
  const step = GRID_CELL * 0.5;
  const stepsAlong = Math.ceil(len / step);
  const stepsAcross = Math.ceil(halfWidth / step);

  for (let i = 0; i <= stepsAlong; i++) {
    const t = Math.min(i * step, len);
    const cx = ax + ux * t;
    const cz = az + uz * t;
    for (let j = -stepsAcross; j <= stepsAcross; j++) {
      const px = cx + nx * j * step;
      const pz = cz + nz * j * step;
      const [col, row] = worldToGrid(px, pz);
      out.add(cellKey(col, row));
    }
  }
}

function rasteriseRoads(roads: SceneRoad[]): Set<string> {
  const occupied = new Set<string>();
  for (const road of roads) {
    if (!VEHICLE_TYPES.has(road.type)) continue;
    const hw = road.width / 2;
    const pts = road.points;
    for (let i = 0; i < pts.length - 1; i++) {
      rasteriseThickSegment(
        pts[i][0], pts[i][1],
        pts[i + 1][0], pts[i + 1][1],
        hw, occupied,
      );
    }
  }
  return occupied;
}

// ─── Step 2: Classify cells (neighbour bitmask → tile) ──────────

interface CellInfo {
  col: number;
  row: number;
  tile: TileType;
  rot: number;
}

function classifyCells(occupied: Set<string>): Map<string, CellInfo> {
  const cells = new Map<string, CellInfo>();

  for (const key of occupied) {
    const [colStr, rowStr] = key.split(',');
    const col = Number(colStr);
    const row = Number(rowStr);

    const mask =
      (occupied.has(cellKey(col, row - 1)) ? N : 0) |
      (occupied.has(cellKey(col + 1, row)) ? E : 0) |
      (occupied.has(cellKey(col, row + 1)) ? S : 0) |
      (occupied.has(cellKey(col - 1, row)) ? W : 0);

    const entry = LOOKUP[mask];
    cells.set(key, { col, row, tile: entry.tile, rot: entry.rot });
  }

  return cells;
}

// ─── Step 3: Crossing placement ─────────────────────────────────

function assignCrossings(cells: Map<string, CellInfo>): void {
  for (const cell of cells.values()) {
    if (cell.tile !== 'road_straight') continue;
    // Use absolute grid position for consistent spacing
    const idx = Math.abs(cell.col) + Math.abs(cell.row);
    if (idx % CROSSING_INTERVAL === 0) {
      cell.tile = 'road_crossing';
    }
  }
}

// ─── Step 4: Sidewalks (8-connectivity border) ──────────────────

function computeSidewalks(
  occupied: Set<string>,
): GridTileInstance[] {
  const sidewalkKeys = new Set<string>();

  for (const key of occupied) {
    const [colStr, rowStr] = key.split(',');
    const col = Number(colStr);
    const row = Number(rowStr);

    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        const nk = cellKey(col + dc, row + dr);
        if (!occupied.has(nk)) {
          sidewalkKeys.add(nk);
        }
      }
    }
  }

  const instances: GridTileInstance[] = [];
  for (const key of sidewalkKeys) {
    const [colStr, rowStr] = key.split(',');
    const col = Number(colStr);
    const row = Number(rowStr);
    const [wx, wz] = gridToWorld(col, row);
    instances.push({ x: wx, y: bestY(wx, wz), z: wz, rotationY: 0 });
  }
  return instances;
}

// ─── Step 5: Orchestrator ────────────────────────────────────────

export function computeRoadGrid(roads: SceneRoad[]): RoadGridResult {
  const occupied = rasteriseRoads(roads);
  const cells = classifyCells(occupied);
  assignCrossings(cells);

  // Group instances by tile type
  const tileGroups = new Map<string, GridTileInstance[]>();
  tileGroups.set('road_straight', []);
  tileGroups.set('road_crossing', []);
  tileGroups.set('road_corner', []);
  tileGroups.set('road_tsplit', []);
  tileGroups.set('road_junction', []);

  for (const cell of cells.values()) {
    const [wx, wz] = gridToWorld(cell.col, cell.row);
    const y = bestY(wx, wz);
    tileGroups.get(cell.tile)!.push({ x: wx, y, z: wz, rotationY: cell.rot });
  }

  const sidewalks = computeSidewalks(occupied);

  return { tileGroups, sidewalks };
}

// ─── Surface height population (for player collision) ────────────

export function populateGridSurface(
  result: RoadGridResult,
  surfGrid: Map<string, number>,
): void {
  surfGrid.clear();

  const storeCell = (inst: GridTileInstance) => {
    const key = `${Math.round(inst.x / GRID_CELL)},${Math.round(inst.z / GRID_CELL)}`;
    const top = inst.y + TILE_TOP;
    if (!surfGrid.has(key) || top > surfGrid.get(key)!) {
      surfGrid.set(key, top);
    }
  };

  // Road cells
  for (const instances of result.tileGroups.values()) {
    for (const inst of instances) storeCell(inst);
  }
  // Sidewalk cells
  for (const inst of result.sidewalks) storeCell(inst);
}
