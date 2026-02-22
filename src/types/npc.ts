// ─── Route types ─────────────────────────────────────────────────

export interface RouteSegment {
  points: [number, number][];     // [x, z][] polyline in scene units
  totalLength: number;            // precomputed total length (meters)
  segmentLengths: number[];       // length of each sub-segment
  cumulativeLengths: number[];    // cumulative distance at each point index
  width: number;                  // route width (meters) — used for side offset
}

// ─── Animated entity types ──────────────────────────────────────

export interface AnimatedCar {
  routeIndex: number;             // index into car route pool
  progress: number;               // 0..totalLength distance along route
  speed: number;                  // m/s (5-8)
  direction: 1 | -1;             // forward or backward along polyline
  variantIndex: number;           // index into KENNEY_CARS
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
