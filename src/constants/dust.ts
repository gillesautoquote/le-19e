export const DUST = {
  // Pool
  count: 80,

  // Spawn zone (centered on player)
  spawnRadius: 20,
  spawnMinRadius: 1,

  // Height range above terrain
  heightMin: 0.5,
  heightMax: 4,

  // Movement (slow rising motes)
  riseSpeedMin: 0.1,
  riseSpeedMax: 0.25,
  driftSpeed: 0.3,

  // Sinusoidal wobble
  wobbleAmplitude: 0.3,
  wobbleFreq: 0.2,

  // Geometry
  particleSize: 0.04,

  // Cull multiplier
  cullMultiplier: 1.5,
} as const;
