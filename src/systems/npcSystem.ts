/** npcSystem.ts — Module-level state & tick logic for animated NPCs. */
import { NPC } from '@/constants/npc';
import {
  sampleRoute, sampleRouteOffset, distSq,
  buildRouteGraph, transitionCar, enforceFollowingDistance,
} from '@/systems/npcRoutes';
import {
  buildCarRoutes, buildBoatRoutes, buildPedRoutes, resetSpawnCounter,
  spawnCar, spawnBoat, spawnBird, spawnPedestrian,
} from '@/systems/npcSpawning';
import type { SceneRoad, SceneWater } from '@/types/osm';
import type {
  RouteSegment, RouteEndpoints, AnimatedCar, AnimatedBoat, AnimatedBird, AnimatedPedestrian,
} from '@/types/npc';

// ─── Module-level state ─────────────────────────────────────────
let carRoutes: RouteSegment[] = [];
let routeGraph: RouteEndpoints[] = [];
let boatRoutes: RouteSegment[] = [];
let pedRoutes: RouteSegment[] = [];
let cars: AnimatedCar[] = [];
let boats: AnimatedBoat[] = [];
let birds: AnimatedBird[] = [];
let pedestrians: AnimatedPedestrian[] = [];
let initialized = false;
let globalTime = 0;

// ─── Public API ─────────────────────────────────────────────────

export function initNPCs(
  roads: SceneRoad[], waterways: SceneWater[],
  playerX: number, playerZ: number,
): void {
  carRoutes = buildCarRoutes(roads);
  routeGraph = buildRouteGraph(carRoutes);
  boatRoutes = buildBoatRoutes(waterways);
  pedRoutes = buildPedRoutes(roads);

  cars = []; boats = []; birds = []; pedestrians = [];
  resetSpawnCounter(); globalTime = 0;

  for (let i = 0; i < NPC.maxCars; i++) {
    const c = spawnCar(carRoutes, playerX, playerZ); if (c) cars.push(c);
  }
  for (let i = 0; i < NPC.boatCount; i++) {
    const b = spawnBoat(boatRoutes); if (b) boats.push(b);
  }
  for (let i = 0; i < NPC.birdCount; i++) {
    birds.push(spawnBird(boatRoutes, playerX, playerZ));
  }
  for (let i = 0; i < NPC.maxPedestrians; i++) {
    const p = spawnPedestrian(pedRoutes, playerX, playerZ); if (p) pedestrians.push(p);
  }
  initialized = true;
}

export function tickNPCs(delta: number, playerX: number, playerZ: number): void {
  if (!initialized) return;
  globalTime += delta;
  const cullR2 = NPC.cullRadius * NPC.cullRadius;

  // Cars
  for (const car of cars) {
    if (!car.alive) continue;
    car.progress += car.speed * car.direction * delta;
    let route = carRoutes[car.routeIndex];
    if (!route) { car.alive = false; continue; }
    if (car.progress > route.totalLength || car.progress < 0) {
      if (!transitionCar(car, carRoutes, routeGraph)) {
        car.alive = false; continue;
      }
      route = carRoutes[car.routeIndex];
    }
    const s = sampleRouteOffset(route, car.progress, car.laneOffset);
    car.x = s.x; car.z = s.z;
    car.rotationY = car.direction === 1 ? s.rotationY : s.rotationY + Math.PI;
    if (distSq(car.x, car.z, playerX, playerZ) > cullR2) car.alive = false;
  }
  enforceFollowingDistance(cars, carRoutes, NPC.carFollowDistance);
  let aliveCars = 0;
  for (const c of cars) if (c.alive) aliveCars++;
  for (const car of cars) {
    if (car.alive || aliveCars >= NPC.maxCars) continue;
    const nc = spawnCar(carRoutes, playerX, playerZ);
    if (nc) { Object.assign(car, nc); aliveCars++; }
  }

  // Boats
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
    const np = spawnPedestrian(pedRoutes, playerX, playerZ);
    if (np) { Object.assign(ped, np); alivePeds++; }
  }
}

// ─── Readonly accessors ─────────────────────────────────────────

export function getAnimatedCars(): readonly AnimatedCar[] { return cars; }
export function getAnimatedBoats(): readonly AnimatedBoat[] { return boats; }
export function getAnimatedBirds(): readonly AnimatedBird[] { return birds; }
export function getAnimatedPedestrians(): readonly AnimatedPedestrian[] { return pedestrians; }
export function getPedRoutes(): readonly RouteSegment[] { return pedRoutes; }
export function isNPCInitialized(): boolean { return initialized; }
