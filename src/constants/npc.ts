export const NPC = {
  // Cars
  carSpacing: 80,
  carSpeedMin: 5,
  carSpeedMax: 8,
  maxCars: 50,
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

  // Shared
  cullRadius: 200,
  spawnMinDist: 150,
} as const;
