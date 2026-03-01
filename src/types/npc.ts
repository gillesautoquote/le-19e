// ─── Route types ─────────────────────────────────────────────────

export interface RouteSegment {
  points: [number, number][];     // [x, z][] polyline in scene units
  totalLength: number;            // precomputed total length (meters)
  segmentLengths: number[];       // length of each sub-segment
  cumulativeLengths: number[];    // cumulative distance at each point index
  width: number;                  // route width (meters) — used for side offset
  oneway: boolean;                // true = one-way street
}

export interface RouteConnection {
  targetRoute: number;            // index into routes array
  enterAtStart: boolean;          // true = progress=0 dir=1, false = progress=end dir=-1
}

export interface RouteEndpoints {
  atStart: RouteConnection[];     // connections reachable from route start
  atEnd: RouteConnection[];       // connections reachable from route end
}

// ─── Animated entity types ──────────────────────────────────────

export interface AnimatedCar {
  routeIndex: number;             // index into car route pool
  progress: number;               // 0..totalLength distance along route
  speed: number;                  // m/s (5-8)
  direction: 1 | -1;             // forward or backward along polyline
  variantIndex: number;           // index into KENNEY_CARS
  laneOffset: number;             // perpendicular offset from centerline (meters)
  alive: boolean;                 // false = ready for respawn
  x: number;
  z: number;
  rotationY: number;
}

export interface AnimatedBoat {
  routeIndex: number;
  progress: number;
  speed: number;                  // m/s (1-2)
  direction: 1 | -1;
  variantIndex: number;           // index into KENNEY_BOATS
  sideSign: 1 | -1;              // which side of the canal (+1 or -1)
  alive: boolean;
  rockPhase: number;              // phase offset for rocking animation
  x: number;
  z: number;
  rotationY: number;
  rockAngle: number;              // current rocking rotation (X axis)
}

export interface AnimatedBird {
  centerX: number;                // center of circular flight
  centerZ: number;
  radius: number;                 // flight radius (8-15m)
  altitude: number;               // y position (20-30m)
  angle: number;                  // current angle in radians
  angularSpeed: number;           // radians/sec
  flapPhase: number;              // phase for wing flapping
  flapSpeed: number;              // flap frequency (rad/s)
  x: number;
  z: number;
  wingAngle: number;              // current wing rotation
}

export interface AnimatedPedestrian {
  routeIndex: number;
  progress: number;
  speed: number;                  // m/s (1-2)
  direction: 1 | -1;
  alive: boolean;
  walkPhase: number;              // phase for leg animation
  colorVariant: number;           // index for body color variety
  x: number;
  z: number;
  rotationY: number;
  leftLegAngle: number;
  rightLegAngle: number;
}

// ─── Falling leaves ─────────────────────────────────────────────

export interface FallingLeaf {
  anchorX: number;                // tree trunk world X (absolute)
  anchorZ: number;                // tree trunk world Z (absolute)
  spawnY: number;                 // world Y at spawn
  fallSpeed: number;              // m/s downward
  wobbleFreq: number;             // Hz lateral sinusoid
  wobblePhaseX: number;           // phase offset X
  wobblePhaseZ: number;           // phase offset Z
  spinSpeed: number;              // rad/s tumble
  spinPhase: number;              // starting rotation
  colorVariant: number;           // 0-5 index into leaf colors
  worldX: number;                 // current world position
  worldY: number;
  worldZ: number;
  localTime: number;              // seconds since spawn/reset
  rotationY: number;
  rotationZ: number;
}

// ─── Ground pigeons ─────────────────────────────────────────────

export type PigeonState = 'pecking' | 'scattering' | 'gone';

export interface Pigeon {
  localX: number;                 // position relative to group center
  localZ: number;
  wanderAngle: number;            // current wander direction
  wanderTimer: number;            // seconds until next wander change
  peckPhase: number;              // phase for head bob
  wingPhase: number;              // phase for wing flap
  wingAngle: number;              // current wing rotation
  headY: number;                  // current head Y offset (peck bob)
  scatterVX: number;              // X velocity during scatter
  scatterVZ: number;              // Z velocity during scatter
  scatterVY: number;              // Y velocity during scatter (upward)
}

export interface PigeonGroup {
  centerX: number;                // world position of group center
  centerZ: number;
  state: PigeonState;
  stateTimer: number;             // seconds in current state
  pigeons: Pigeon[];
  groundY: number;                // terrain height at group center
}
