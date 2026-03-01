export const NPC = {
  // Cars
  carSpacing: 80,
  carSpeedMin: 5,
  carSpeedMax: 8,
  maxCars: 25,
  carFollowDistance: 12,
  carEligibleTypes: new Set(['primary', 'secondary', 'tertiary', 'residential']) as ReadonlySet<string>,

  // Boats
  boatCount: 4,
  boatSpeedMin: 1,
  boatSpeedMax: 2,
  boatRockAmplitude: 0.04,
  boatRockFrequency: 0.8,

  // Birds
  birdCount: 10,
  birdAltitudeMin: 20,
  birdAltitudeMax: 30,
  birdRadiusMin: 8,
  birdRadiusMax: 15,
  birdFlapAmplitude: 0.6,
  birdFlapSpeedMin: 3,
  birdFlapSpeedMax: 5,
  birdAngularSpeedMin: 0.3,
  birdAngularSpeedMax: 0.6,

  // Pedestrians
  pedestrianSpeedMin: 1,
  pedestrianSpeedMax: 2,
  maxPedestrians: 8,
  pedestrianLegSwingAmplitude: 0.5,
  pedestrianLegSwingSpeed: 4,

  // Ground pigeons
  pigeonGroupCount: 5,
  pigeonPerGroup: 6,
  pigeonSpawnRadius: 25,
  pigeonPeckSpeed: 1.8,
  pigeonPeckAmplitude: 0.25,
  pigeonWalkRadius: 1.5,
  pigeonWalkSpeed: 0.4,
  pigeonScatterDist: 5,
  pigeonScatterSpeed: 4.0,
  pigeonScatterDuration: 2.0,
  pigeonFlapSpeedGround: 0.8,
  pigeonFlapSpeedScatter: 6.0,

  // Shared
  cullRadius: 200,
  spawnMinDist: 150,
} as const;
