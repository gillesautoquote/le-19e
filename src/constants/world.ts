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

  // Terrain mesh resolution (meters between vertices — 30m keeps ~145K tris)
  terrainMeshCellSize: 30,

  // Water (above ground so canal is visible over single ground plane)
  waterY: 0.5,
  waterSegmentsX: 120,
  waterSegmentsZ: 12,

  // Canal trench — water sits below terrain, walls visible above water line
  canalWaterDepth: 1.8,   // meters below terrain → water surface
  canalBedDepth: 3,       // meters below terrain → canal floor
  canalWalkwayWidth: 3,   // meters — stone walkway on each bank
} as const;

// Camera defaults
export const CAMERA = {
  fov: 45,
  near: 1,
  far: 800,
  initialPosition: [200, 25, -95] as const,

  // Orbit
  distanceDefault: 20,
  distanceMin: 10,
  distanceMax: 200,
  zoomSpeed: 3,
  orbitSpeed: 0.005,
  tiltSpeed: 0.003,
  followSmoothness: 0.1,

  // Auto-follow (camera orbits behind player when moving)
  autoFollowSpeed: 1.5,
  autoFollowDelay: 0.3,

  // Angles (radians)
  initialTheta: 0,
  initialPhi: Math.PI / 3,
  phiMin: 0.1,
  phiMax: Math.PI / 2.2,
} as const;

// Lighting (colors reference epochs.ts palettes — see Lighting atom)
export const LIGHTING = {
  ambientIntensity: 0.4,
  sunIntensity: 1.8,
  sunPosition: [80, 35, 50] as const,
  fillLightIntensity: 0.3,
  fillLightPosition: [-60, 20, -40] as const,
  shadowMapSize: 2048,
  shadowCameraNear: 0.5,
  shadowCameraFar: 200,
  shadowCameraSize: 100,
  shadowRadius: 3,
  shadowBias: -0.0005,
  hemisphereIntensity: 0.3,
} as const;

// Building labels
export const BUILDING_LABEL = {
  heightOffset: 2,
} as const;

// Lamp point lights (pooled — only N closest to player are lit)
export const LAMP_LIGHTS = {
  poolSize: 8,
  intensity: 1.5,
  distance: 20,
  decay: 2,
  lightHeight: 3.8,
  updateInterval: 10,
} as const;

// Fog
export const FOG = {
  near: 150,
  far: 600,
  transitionSpeed: 2,
} as const;
