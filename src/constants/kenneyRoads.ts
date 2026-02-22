export interface KenneyRoadTileDef {
  key: string;
  path: string;
  nativeSize: number; // XZ footprint (always 1.0 for Kenney road tiles)
  nativeHeight: number;
}

/** Clean asphalt road surface (no lane markings). */
export const ROAD_TILE: KenneyRoadTileDef = {
  key: 'tile-low',
  path: '/models/kenney/roads/tile-low.glb',
  nativeSize: 1.0,
  nativeHeight: 0.02,
};

/** Zebra / pedestrian crossing. */
export const CROSSING_TILE: KenneyRoadTileDef = {
  key: 'road-crossing',
  path: '/models/kenney/roads/road-crossing.glb',
  nativeSize: 1.0,
  nativeHeight: 0.02,
};

/** Bridge surface (raised 0.52). */
export const BRIDGE_TILE: KenneyRoadTileDef = {
  key: 'road-bridge',
  path: '/models/kenney/roads/road-bridge.glb',
  nativeSize: 1.0,
  nativeHeight: 0.52,
};

/** Raised sidewalk tile. */
export const SIDEWALK_TILE: KenneyRoadTileDef = {
  key: 'tile-high',
  path: '/models/kenney/roads/tile-high.glb',
  nativeSize: 1.0,
  nativeHeight: 0.25,
};

/** Nature kit dirt path. */
export const PATH_TILE: KenneyRoadTileDef = {
  key: 'ground-path',
  path: '/models/kenney/nature/ground_pathStraight.glb',
  nativeSize: 1.0,
  nativeHeight: 0.05,
};

/** All tiles that need preloading. */
export const ALL_ROAD_TILES: KenneyRoadTileDef[] = [
  ROAD_TILE,
  CROSSING_TILE,
  BRIDGE_TILE,
  SIDEWALK_TILE,
  PATH_TILE,
];
