/**
 * npcSystem.ts — State management & tick logic for animated NPCs.
 *
 * State lives at module level (not Zustand) for zero re-render overhead.
 * Components call tickNPCs() from useFrame, then read via getAnimatedCars() etc.
 */
import { NPC } from '@/constants/npc';
import { KENNEY_CARS } from '@/constants/kenneyCars';
import { KENNEY_BOATS } from '@/constants/kenneyWatercraft';
import { hashString } from '@/utils/geoUtils';
import {
  buildRoute, sampleRoute, sampleRouteOffset,
  seededRandom, randomRange, distSq, routeNearPlayer,
} from '@/systems/npcRoutes';
import type { SceneRoad, SceneWater } from '@/types/osm';
import type {
  RouteSegment, AnimatedCar, AnimatedBoat, AnimatedBird, AnimatedPedestrian,
} from '@/types/npc';

// ─── Module-level state ─────────────────────────────────────────

let carRoutes: RouteSegment[] = [];
let boatRoutes: RouteSegment[] = [];
let pedRoutes: RouteSegment[] = [];

let cars: AnimatedCar[] = [];
let boats: AnimatedBoat[] = [];
let birds: AnimatedBird[] = [];
let pedestrians: AnimatedPedestrian[] = [];
let initialized = false;
let spawnCounter = 0;
let globalTime = 0;

// ─── Spawn helpers ──────────────────────────────────────────────

function spawnCar(px: number, pz: number): AnimatedCar | null {
  if (carRoutes.length === 0) return null;
  const seed = ++spawnCounter;
  let rIdx = Math.abs(hashString(`car${seed}`)) % carRoutes.length;
  let route = carRoutes[rIdx];

  const mid = sampleRoute(route, route.totalLength * 0.5);
  if (distSq(mid.x, mid.z, px, pz) > NPC.cullRadius * NPC.cullRadius) {
    const alt = routeNearPlayer(carRoutes, px, pz, NPC.cullRadius);
    if (alt === -1) return null;
    rIdx = alt;
    route = carRoutes[alt];
  }

  const progress = randomRange(0, route.totalLength, seed);
  // One-way: always direction 1, center lane (offset 0)
  // Two-way: random direction, offset to right side (France = drive right)
  const direction: 1 | -1 = route.oneway ? 1 : (seededRandom(seed + 2) > 0.5 ? 1 : -1);
  const laneOffset = route.oneway ? 0 : -direction * route.width * 0.25;
  const s = sampleRouteOffset(route, progress, laneOffset);
  return {
    routeIndex: rIdx, progress,
    speed: randomRange(NPC.carSpeedMin, NPC.carSpeedMax, seed + 1),
    direction,
    variantIndex: Math.abs(hashString(`v${seed}`)) % KENNEY_CARS.length,
    laneOffset,
    alive: true, x: s.x, z: s.z, rotationY: s.rotationY,
  };
}

function spawnBoat(): AnimatedBoat | null {
  if (boatRoutes.length === 0) return null;
  const seed = ++spawnCounter;
  const rIdx = Math.abs(hashString(`boat${seed}`)) % boatRoutes.length;
  const route = boatRoutes[rIdx];
  const progress = randomRange(0, route.totalLength, seed);
  const sideSign: 1 | -1 = seededRandom(seed + 4) > 0.5 ? 1 : -1;
  // Offset to canal edge minus a small margin so boat sits inside the water
  const offset = sideSign * (route.width * 0.5 - 3);
  const s = sampleRouteOffset(route, progress, offset);
  return {
    routeIndex: rIdx, progress,
    speed: randomRange(NPC.boatSpeedMin, NPC.boatSpeedMax, seed + 1),
    direction: seededRandom(seed + 2) > 0.5 ? 1 : -1,
    variantIndex: Math.abs(hashString(`bv${seed}`)) % KENNEY_BOATS.length,
    sideSign,
    alive: true, rockPhase: seededRandom(seed + 3) * Math.PI * 2,
    x: s.x, z: s.z, rotationY: s.rotationY, rockAngle: 0,
  };
}

function spawnBird(px: number, pz: number): AnimatedBird {
  const seed = ++spawnCounter;
  let cx = px + randomRange(-50, 50, seed);
  let cz = pz + randomRange(-50, 50, seed + 1);
  if (boatRoutes.length > 0) {
    const rIdx = Math.abs(hashString(`bird${seed}`)) % boatRoutes.length;
    const route = boatRoutes[rIdx];
    const s = sampleRoute(route, randomRange(0, route.totalLength, seed + 2));
    cx = s.x + randomRange(-20, 20, seed + 3);
    cz = s.z + randomRange(-20, 20, seed + 4);
  }
  return {
    centerX: cx, centerZ: cz,
    radius: randomRange(NPC.birdRadiusMin, NPC.birdRadiusMax, seed + 5),
    altitude: randomRange(NPC.birdAltitudeMin, NPC.birdAltitudeMax, seed + 6),
    angle: seededRandom(seed + 7) * Math.PI * 2,
    angularSpeed: randomRange(NPC.birdAngularSpeedMin, NPC.birdAngularSpeedMax, seed + 8),
    flapPhase: seededRandom(seed + 9) * Math.PI * 2,
    flapSpeed: randomRange(NPC.birdFlapSpeedMin, NPC.birdFlapSpeedMax, seed + 10),
    x: cx, z: cz, wingAngle: 0,
  };
}

function spawnPedestrian(px: number, pz: number): AnimatedPedestrian | null {
  if (pedRoutes.length === 0) return null;
  const seed = ++spawnCounter;
  const alt = routeNearPlayer(pedRoutes, px, pz, NPC.cullRadius);
  const rIdx = alt >= 0 ? alt : Math.abs(hashString(`ped${seed}`)) % pedRoutes.length;
  const route = pedRoutes[rIdx];
  const progress = randomRange(0, route.totalLength, seed);
  const s = sampleRoute(route, progress);
  return {
    routeIndex: rIdx, progress,
    speed: randomRange(NPC.pedestrianSpeedMin, NPC.pedestrianSpeedMax, seed + 1),
    direction: seededRandom(seed + 2) > 0.5 ? 1 : -1,
    alive: true, walkPhase: seededRandom(seed + 3) * Math.PI * 2,
    colorVariant: Math.abs(hashString(`pc${seed}`)) % 4,
    x: s.x, z: s.z, rotationY: s.rotationY,
    leftLegAngle: 0, rightLegAngle: 0,
  };
}

// ─── Public API ─────────────────────────────────────────────────

export function initNPCs(
  roads: SceneRoad[], waterways: SceneWater[],
  playerX: number, playerZ: number,
): void {
  carRoutes = roads
    .filter((r) => NPC.carEligibleTypes.has(r.type) && r.points.length >= 2)
    .map((r) => buildRoute(r.points, r.width, r.oneway));
  boatRoutes = waterways
    .filter((w) => w.points.length >= 2)
    .map((w) => buildRoute(w.points, w.width));
  pedRoutes = roads
    .filter((r) => r.type === 'footway' && r.points.length >= 2)
    .map((r) => buildRoute(r.points));

  cars = []; boats = []; birds = []; pedestrians = [];
  spawnCounter = 0; globalTime = 0;

  for (let i = 0; i < NPC.maxCars; i++) {
    const c = spawnCar(playerX, playerZ); if (c) cars.push(c);
  }
  for (let i = 0; i < NPC.boatCount; i++) {
    const b = spawnBoat(); if (b) boats.push(b);
  }
  for (let i = 0; i < NPC.birdCount; i++) {
    birds.push(spawnBird(playerX, playerZ));
  }
  for (let i = 0; i < NPC.maxPedestrians; i++) {
    const p = spawnPedestrian(playerX, playerZ); if (p) pedestrians.push(p);
  }
  initialized = true;
}

export function tickNPCs(delta: number, playerX: number, playerZ: number): void {
  if (!initialized) return;
  globalTime += delta;
  const cullR2 = NPC.cullRadius * NPC.cullRadius;

  // Cars — offset to lane position
  for (const car of cars) {
    if (!car.alive) continue;
    car.progress += car.speed * car.direction * delta;
    const route = carRoutes[car.routeIndex];
    if (!route || car.progress > route.totalLength || car.progress < 0) {
      car.alive = false; continue;
    }
    const s = sampleRouteOffset(route, car.progress, car.laneOffset);
    car.x = s.x; car.z = s.z;
    car.rotationY = car.direction === 1 ? s.rotationY : s.rotationY + Math.PI;
    if (distSq(car.x, car.z, playerX, playerZ) > cullR2) car.alive = false;
  }
  let aliveCars = 0;
  for (const c of cars) if (c.alive) aliveCars++;
  for (const car of cars) {
    if (car.alive || aliveCars >= NPC.maxCars) continue;
    const nc = spawnCar(playerX, playerZ);
    if (nc) { Object.assign(car, nc); aliveCars++; }
  }

  // Boats — follow canal edge (offset by sideSign * half-width)
  for (const boat of boats) {
    if (!boat.alive) continue;
    boat.progress += boat.speed * boat.direction * delta;
    const route = boatRoutes[boat.routeIndex];
    if (!route) { boat.alive = false; continue; }
    if (boat.progress > route.totalLength) {
      boat.progress = route.totalLength; boat.direction = -1;
    } else if (boat.progress < 0) {
      boat.progress = 0; boat.direction = 1;
    }
    const offset = boat.sideSign * (route.width * 0.5 - 3);
    const s = sampleRouteOffset(route, boat.progress, offset);
    boat.x = s.x; boat.z = s.z;
    boat.rotationY = boat.direction === 1 ? s.rotationY : s.rotationY + Math.PI;
    boat.rockAngle = Math.sin(
      globalTime * NPC.boatRockFrequency * Math.PI * 2 + boat.rockPhase,
    ) * NPC.boatRockAmplitude;
  }

  // Birds
  for (const bird of birds) {
    bird.angle += bird.angularSpeed * delta;
    bird.x = bird.centerX + Math.cos(bird.angle) * bird.radius;
    bird.z = bird.centerZ + Math.sin(bird.angle) * bird.radius;
    bird.flapPhase += bird.flapSpeed * delta;
    bird.wingAngle = Math.sin(bird.flapPhase) * NPC.birdFlapAmplitude;
  }

  // Pedestrians
  for (const ped of pedestrians) {
    if (!ped.alive) continue;
    ped.progress += ped.speed * ped.direction * delta;
    const route = pedRoutes[ped.routeIndex];
    if (!route || ped.progress > route.totalLength || ped.progress < 0) {
      ped.alive = false; continue;
    }
    const s = sampleRoute(route, ped.progress);
    ped.x = s.x; ped.z = s.z;
    ped.rotationY = ped.direction === 1 ? s.rotationY : s.rotationY + Math.PI;
    ped.walkPhase += NPC.pedestrianLegSwingSpeed * delta;
    ped.leftLegAngle = Math.sin(ped.walkPhase) * NPC.pedestrianLegSwingAmplitude;
    ped.rightLegAngle = -ped.leftLegAngle;
    if (distSq(ped.x, ped.z, playerX, playerZ) > cullR2) ped.alive = false;
  }
  let alivePeds = 0;
  for (const p of pedestrians) if (p.alive) alivePeds++;
  for (const ped of pedestrians) {
    if (ped.alive || alivePeds >= NPC.maxPedestrians) continue;
    const np = spawnPedestrian(playerX, playerZ);
    if (np) { Object.assign(ped, np); alivePeds++; }
  }
}

// ─── Readonly accessors ─────────────────────────────────────────

export function getAnimatedCars(): readonly AnimatedCar[] { return cars; }
export function getAnimatedBoats(): readonly AnimatedBoat[] { return boats; }
export function getAnimatedBirds(): readonly AnimatedBird[] { return birds; }
export function getAnimatedPedestrians(): readonly AnimatedPedestrian[] { return pedestrians; }
export function isNPCInitialized(): boolean { return initialized; }
