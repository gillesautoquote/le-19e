// World dimensions and bounds — sized to real OSM data (19e arrondissement)
export const WORLD = {
  // Ground total (large enough to cover all data — single plane, no perf cost)
  groundLength: 10000,
  groundDepth: 10000,

  // Playable bounds (covers 19e + surrounding area)
  boundsXMin: -1500,
  boundsXMax: 5000,
  boundsZMin: -4200,
  boundsZMax: 3500,

  // Terrain mesh resolution (meters between vertices)
  terrainMeshCellSize: 20,

  // Water (above ground so canal is visible over single ground plane)
  waterY: 0.5,
  waterSegmentsX: 120,
  waterSegmentsZ: 12,
} as const;

// Camera defaults
export const CAMERA = {
  fov: 45,
  near: 1,
  far: 800,
  initialPosition: [200, 25, -95] as const,

  // Orbit
  distanceDefault: 35,
  distanceMin: 10,
  distanceMax: 200,
  zoomSpeed: 3,
  orbitSpeed: 0.005,
  tiltSpeed: 0.003,
  followSmoothness: 0.06,
  keyRotateSpeed: 1.5,

  // Angles (radians)
  initialTheta: 0,
  initialPhi: Math.PI / 5,
  phiMin: 0.1,
  phiMax: Math.PI / 2.2,
} as const;

// Lighting (colors reference epochs.ts palettes — see Lighting atom)
export const LIGHTING = {
  ambientIntensity: 0.4,
  sunIntensity: 1.5,
  sunPosition: [50, 80, 30] as const,
  shadowMapSize: 1024,
  shadowCameraNear: 0.5,
  shadowCameraFar: 200,
  shadowCameraSize: 100,
  hemisphereIntensity: 0.3,
} as const;

// Building labels
export const BUILDING_LABEL = {
  heightOffset: 2,
} as const;

// Fog
export const FOG = {
  near: 150,
  far: 600,
  transitionSpeed: 2,
} as const;
