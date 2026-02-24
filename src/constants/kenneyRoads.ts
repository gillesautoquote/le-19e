export interface KenneyRoadTileDef {
  key: string;
  path: string;
  nativeSize: number;     // XZ footprint (always 1.0 for road tiles)
  nativeHeight: number;
  rotationOffset: number; // extra Y rotation to align road direction
  swapScale: boolean;     // true when rotationOffset swaps X/Z axes
}

/** Road surface with lane markings — KayKit City Builder Bits.
 *  KayKit road runs along Z; our system expects X → rotate PI/2 + swap scales. */
export const ROAD_TILE: KenneyRoadTileDef = {
  key: 'road-straight',
  path: '/models/kaykit/road_straight.glb',
  nativeSize: 1.0,
  nativeHeight: 0.1,
  rotationOffset: Math.PI / 2,
  swapScale: true,
};

/** Zebra / pedestrian crossing — KayKit City Builder Bits. */
export const CROSSING_TILE: KenneyRoadTileDef = {
  key: 'road-crossing',
  path: '/models/kaykit/road_straight_crossing.glb',
  nativeSize: 1.0,
  nativeHeight: 0.1,
  rotationOffset: Math.PI / 2,
  swapScale: true,
};

/** Bridge surface (Kenney — road along X, no rotation needed). */
export const BRIDGE_TILE: KenneyRoadTileDef = {
  key: 'road-bridge',
  path: '/models/kenney/roads/road-bridge.glb',
  nativeSize: 1.0,
  nativeHeight: 0.52,
  rotationOffset: 0,
  swapScale: false,
};

/** Raised sidewalk tile — KayKit base (symmetric, no swap needed). */
export const SIDEWALK_TILE: KenneyRoadTileDef = {
  key: 'base',
  path: '/models/kaykit/base.glb',
  nativeSize: 1.0,
  nativeHeight: 0.1,
  rotationOffset: 0,
  swapScale: false,
};

/** Nature kit dirt path (Kenney). */
export const PATH_TILE: KenneyRoadTileDef = {
  key: 'ground-path',
  path: '/models/kenney/nature/ground_pathStraight.glb',
  nativeSize: 1.0,
  nativeHeight: 0.05,
  rotationOffset: 0,
  swapScale: false,
};

/** All tiles that need preloading. */
export const ALL_ROAD_TILES: KenneyRoadTileDef[] = [
  ROAD_TILE,
  CROSSING_TILE,
  BRIDGE_TILE,
  SIDEWALK_TILE,
  PATH_TILE,
];
