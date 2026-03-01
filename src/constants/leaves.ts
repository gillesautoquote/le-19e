export const LEAVES = {
  // Pool
  count: 150,

  // Spawn zone (centered on player)
  spawnRadius: 40,
  spawnMinRadius: 2,

  // Height range above terrain
  spawnHeightMin: 3,
  spawnHeightMax: 18,

  // Fall physics
  fallSpeedMin: 0.4,
  fallSpeedMax: 1.2,

  // Lateral drift (breeze)
  breezeStrength: 0.6,
  breezeFrequency: 0.3,

  // Sinusoidal wobble
  wobbleAmplitude: 0.8,
  wobbleFreqMin: 0.4,
  wobbleFreqMax: 0.9,

  // Rotation / tumble
  spinSpeedMin: 0.5,
  spinSpeedMax: 2.5,

  // Geometry
  leafSize: 0.18,

  // Color variants
  colorVariantCount: 6,

  // Cull multiplier (respawn if leaf drifts beyond spawnRadius * this)
  cullMultiplier: 1.5,

  // Tree-anchored spawning
  treeSearchRadius: 45,        // max distance from player to search for trees
  canopySpreadFrac: 0.35,      // canopy radius = treeHeight * this
  spawnHeightFracMin: 0.45,    // leaf starts at treeHeight * this (min)
  spawnHeightFracMax: 0.92,    // leaf starts at treeHeight * this (max)
} as const;
