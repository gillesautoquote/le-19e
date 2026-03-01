/** npcSpawning.ts — Spawn logic for animated NPCs. */
import { NPC } from '@/constants/npc';
import { KENNEY_CARS } from '@/constants/kenneyCars';
import { KENNEY_BOATS } from '@/constants/kenneyWatercraft';
import { hashString } from '@/utils/geoUtils';
import {
  buildRoute, sampleRoute, sampleRouteOffset, seededRandom, randomRange,
  distSq, routeNearPlayer, computeLaneOffset,
} from '@/systems/npcRoutes';
import type { SceneRoad, SceneWater } from '@/types/osm';
import type {
  RouteSegment, AnimatedCar, AnimatedBoat, AnimatedBird, AnimatedPedestrian,
} from '@/types/npc';

let spawnCounter = 0;

export function resetSpawnCounter(): void {
  spawnCounter = 0;
}

export function buildCarRoutes(roads: SceneRoad[]): RouteSegment[] {
  return roads
    .filter((r) => NPC.carEligibleTypes.has(r.type) && r.points.length >= 2)
    .map((r) => buildRoute(r.points, r.width, r.oneway));
}

export function buildBoatRoutes(waterways: SceneWater[]): RouteSegment[] {
  return waterways
    .filter((w) => w.points.length >= 2)
    .map((w) => buildRoute(w.points, w.width));
}

export function buildPedRoutes(roads: SceneRoad[]): RouteSegment[] {
  return roads
    .filter((r) => r.type === 'footway' && r.points.length >= 2)
    .map((r) => buildRoute(r.points));
}

export function spawnCar(
  carRoutes: RouteSegment[],
  px: number,
  pz: number,
): AnimatedCar | null {
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
  const direction: 1 | -1 = route.oneway ? 1 : (seededRandom(seed + 2) > 0.5 ? 1 : -1);
  const laneOffset = computeLaneOffset(route, direction, seed + 3);
  const s = sampleRouteOffset(route, progress, laneOffset);
  return {
    routeIndex: rIdx, progress,
    speed: randomRange(NPC.carSpeedMin, NPC.carSpeedMax, seed + 1),
    direction, variantIndex: Math.abs(hashString(`v${seed}`)) % KENNEY_CARS.length,
    laneOffset, alive: true, x: s.x, z: s.z, rotationY: s.rotationY,
  };
}

export function spawnBoat(boatRoutes: RouteSegment[]): AnimatedBoat | null {
  if (boatRoutes.length === 0) return null;
  const seed = ++spawnCounter;
  const rIdx = Math.abs(hashString(`boat${seed}`)) % boatRoutes.length;
  const route = boatRoutes[rIdx];
  const progress = randomRange(0, route.totalLength, seed);
  const sideSign: 1 | -1 = seededRandom(seed + 4) > 0.5 ? 1 : -1;
  const offset = sideSign * (route.width * 0.5 - 3);
  const s = sampleRouteOffset(route, progress, offset);
  return {
    routeIndex: rIdx, progress,
    speed: randomRange(NPC.boatSpeedMin, NPC.boatSpeedMax, seed + 1),
    direction: seededRandom(seed + 2) > 0.5 ? 1 : -1,
    variantIndex: Math.abs(hashString(`bv${seed}`)) % KENNEY_BOATS.length,
    sideSign, alive: true, rockPhase: seededRandom(seed + 3) * Math.PI * 2,
    x: s.x, z: s.z, rotationY: s.rotationY, rockAngle: 0,
  };
}

export function spawnBird(
  boatRoutes: RouteSegment[],
  px: number,
  pz: number,
): AnimatedBird {
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

export function spawnPedestrian(
  pedRoutes: RouteSegment[],
  px: number,
  pz: number,
): AnimatedPedestrian | null {
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
