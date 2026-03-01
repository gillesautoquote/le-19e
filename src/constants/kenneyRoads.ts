// ─── Grid-based road tile system ─────────────────────────────────

/** KayKit road tile definition for the grid auto-tiling system. */
export interface KaykitRoadTileDef {
  key: string;
  path: string;
  nativeSize: number;   // XZ footprint (2.0 for KayKit, 1.0 for Kenney)
  nativeHeight: number;
}

/** Grid cell size = native KayKit tile size (2m × 2m). */
export const GRID_CELL = 2.0;

// ─── KayKit grid tiles (all 2×2 native) ─────────────────────────

export const ROAD_STRAIGHT: KaykitRoadTileDef = {
  key: 'road_straight',
  path: '/models/kaykit/road_straight.glb',
  nativeSize: 2.0,
  nativeHeight: 0.1,
};

export const ROAD_CROSSING: KaykitRoadTileDef = {
  key: 'road_crossing',
  path: '/models/kaykit/road_straight_crossing.glb',
  nativeSize: 2.0,
  nativeHeight: 0.1,
};

export const ROAD_CORNER: KaykitRoadTileDef = {
  key: 'road_corner',
  path: '/models/kaykit/road_corner_curved.glb',
  nativeSize: 2.0,
  nativeHeight: 0.1,
};

export const ROAD_TSPLIT: KaykitRoadTileDef = {
  key: 'road_tsplit',
  path: '/models/kaykit/road_tsplit.glb',
  nativeSize: 2.0,
  nativeHeight: 0.1,
};

export const ROAD_JUNCTION: KaykitRoadTileDef = {
  key: 'road_junction',
  path: '/models/kaykit/road_junction.glb',
  nativeSize: 2.0,
  nativeHeight: 0.1,
};

export const ROAD_SIDEWALK: KaykitRoadTileDef = {
  key: 'road_sidewalk',
  path: '/models/kaykit/base.glb',
  nativeSize: 2.0,
  nativeHeight: 0.1,
};

/** All grid road tiles for preloading. */
export const ALL_ROAD_GRID_TILES: KaykitRoadTileDef[] = [
  ROAD_STRAIGHT,
  ROAD_CROSSING,
  ROAD_CORNER,
  ROAD_TSPLIT,
  ROAD_JUNCTION,
  ROAD_SIDEWALK,
];

// ─── Legacy tile defs (used by OSMPaths / bridges) ──────────────

/** @deprecated Old interface for ribbon-scaled tiles. */
export interface KenneyRoadTileDef {
  key: string;
  path: string;
  nativeSize: number;
  nativeHeight: number;
  rotationOffset: number;
  swapScale: boolean;
}

export const BRIDGE_TILE: KenneyRoadTileDef = {
  key: 'road-bridge',
  path: '/models/kenney/roads/road-bridge.glb',
  nativeSize: 1.0,
  nativeHeight: 0.52,
  rotationOffset: 0,
  swapScale: false,
};

export const PATH_TILE: KenneyRoadTileDef = {
  key: 'ground-path',
  path: '/models/kenney/nature/ground_pathStraight.glb',
  nativeSize: 1.0,
  nativeHeight: 0.05,
  rotationOffset: 0,
  swapScale: false,
};

/** Legacy tiles that still need preloading. */
export const LEGACY_ROAD_TILES: KenneyRoadTileDef[] = [
  BRIDGE_TILE,
  PATH_TILE,
];
