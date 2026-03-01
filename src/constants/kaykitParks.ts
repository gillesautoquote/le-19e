export interface KaykitParkTileDef {
  key: string;
  path: string;
  nativeSize: number; // tile footprint: always 2.0 (from -1 to +1 on X and Z)
}

/** All tiles are 2×2 native units, centered on origin.
 *  Scale them uniformly so that tileSize = nativeSize × scale. */
export const NATIVE_TILE_SIZE = 2.0;

// ─── Base ground tiles (grass surface) ──────────────────────

export const PARK_BASE: KaykitParkTileDef = {
  key: 'park_base',
  path: '/models/kaykit/park/park_base.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_BASE_BUSHES: KaykitParkTileDef = {
  key: 'park_base_decorated_bushes',
  path: '/models/kaykit/park/park_base_decorated_bushes.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_BASE_TREES: KaykitParkTileDef = {
  key: 'park_base_decorated_trees',
  path: '/models/kaykit/park/park_base_decorated_trees.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

/** Base tile pool with weighted distribution:
 *  60% plain grass, 25% bushes, 15% trees. */
export const PARK_BASE_TILES: KaykitParkTileDef[] = [
  PARK_BASE,
  PARK_BASE_BUSHES,
  PARK_BASE_TREES,
];

export const PARK_BASE_WEIGHTS = [60, 25, 15];

// ─── Wall tiles (boundary) ──────────────────────────────────

export const PARK_WALL_STRAIGHT: KaykitParkTileDef = {
  key: 'park_wall_straight',
  path: '/models/kaykit/park/park_wall_straight.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_WALL_STRAIGHT_DECO: KaykitParkTileDef = {
  key: 'park_wall_straight_decorated',
  path: '/models/kaykit/park/park_wall_straight_decorated.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_WALL_ENTRY: KaykitParkTileDef = {
  key: 'park_wall_entry',
  path: '/models/kaykit/park/park_wall_entry.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_WALL_ENTRY_DECO: KaykitParkTileDef = {
  key: 'park_wall_entry_decorated',
  path: '/models/kaykit/park/park_wall_entry_decorated.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_WALL_INNER: KaykitParkTileDef = {
  key: 'park_wall_innerCorner',
  path: '/models/kaykit/park/park_wall_innerCorner.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_WALL_INNER_DECO: KaykitParkTileDef = {
  key: 'park_wall_innerCorner_decorated',
  path: '/models/kaykit/park/park_wall_innerCorner_decorated.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_WALL_OUTER: KaykitParkTileDef = {
  key: 'park_wall_outerCorner',
  path: '/models/kaykit/park/park_wall_outerCorner.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

export const PARK_WALL_OUTER_DECO: KaykitParkTileDef = {
  key: 'park_wall_outerCorner_decorated',
  path: '/models/kaykit/park/park_wall_outerCorner_decorated.glb',
  nativeSize: NATIVE_TILE_SIZE,
};

// ─── All tiles (for preloading) ─────────────────────────────

export const ALL_PARK_TILES: KaykitParkTileDef[] = [
  PARK_BASE, PARK_BASE_BUSHES, PARK_BASE_TREES,
  PARK_WALL_STRAIGHT, PARK_WALL_STRAIGHT_DECO,
  PARK_WALL_ENTRY, PARK_WALL_ENTRY_DECO,
  PARK_WALL_INNER, PARK_WALL_INNER_DECO,
  PARK_WALL_OUTER, PARK_WALL_OUTER_DECO,
];
