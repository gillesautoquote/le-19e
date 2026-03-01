/**
 * pigeonSystem.ts — State machine for ground pigeon groups.
 *
 * Groups of pigeons peck on the ground near footways.
 * When the player approaches within scatterDist, they fly away.
 * After scatter animation completes, the group respawns elsewhere.
 */
import { NPC } from '@/constants/npc';
import {
  seededRandom, randomRange, distSq,
  sampleRoute, routeNearPlayer,
} from '@/systems/npcRoutes';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { RouteSegment } from '@/types/npc';
import type { PigeonGroup, Pigeon } from '@/types/npc';

const TWO_PI = Math.PI * 2;

// ─── Module-level state ─────────────────────────────────────────

let groups: PigeonGroup[] = [];
let initialized = false;
let spawnCounter = 0;
let routes: RouteSegment[] = [];

// ─── Spawn helpers ──────────────────────────────────────────────

function spawnPigeon(groupSeed: number, index: number): Pigeon {
  const seed = groupSeed * 100 + index;
  return {
    localX: randomRange(-NPC.pigeonWalkRadius, NPC.pigeonWalkRadius, seed),
    localZ: randomRange(-NPC.pigeonWalkRadius, NPC.pigeonWalkRadius, seed + 1),
    wanderAngle: seededRandom(seed + 2) * TWO_PI,
    wanderTimer: randomRange(1.5, 4, seed + 3),
    peckPhase: seededRandom(seed + 4) * TWO_PI,
    wingPhase: seededRandom(seed + 5) * TWO_PI,
    wingAngle: 0,
    headY: 0,
    scatterVX: 0,
    scatterVZ: 0,
    scatterVY: 0,
  };
}

function spawnGroup(px: number, pz: number): PigeonGroup {
  const seed = ++spawnCounter;
  let centerX: number;
  let centerZ: number;

  // Try to place on a footway near the player
  const rIdx = routeNearPlayer(routes, px, pz, NPC.pigeonSpawnRadius);
  if (rIdx >= 0) {
    const route = routes[rIdx];
    const progress = randomRange(0, route.totalLength, seed);
    const s = sampleRoute(route, progress);
    centerX = s.x;
    centerZ = s.z;
  } else {
    // Fallback: random position near player
    const angle = seededRandom(seed) * TWO_PI;
    const radius = randomRange(8, NPC.pigeonSpawnRadius, seed + 1);
    centerX = px + Math.cos(angle) * radius;
    centerZ = pz + Math.sin(angle) * radius;
  }

  const pigeons: Pigeon[] = [];
  for (let i = 0; i < NPC.pigeonPerGroup; i++) {
    pigeons.push(spawnPigeon(seed, i));
  }

  return {
    centerX,
    centerZ,
    state: 'pecking',
    stateTimer: 0,
    pigeons,
    groundY: getTerrainHeight(centerX, centerZ),
  };
}

function triggerScatter(group: PigeonGroup, px: number, pz: number): void {
  group.state = 'scattering';
  group.stateTimer = 0;

  for (const pigeon of group.pigeons) {
    const worldX = group.centerX + pigeon.localX;
    const worldZ = group.centerZ + pigeon.localZ;
    const awayX = worldX - px;
    const awayZ = worldZ - pz;
    const len = Math.sqrt(awayX * awayX + awayZ * awayZ) + 0.01;
    const seed = ++spawnCounter;

    // Fly away from player with slight random spread
    pigeon.scatterVX = (awayX / len) * NPC.pigeonScatterSpeed
      + randomRange(-1, 1, seed);
    pigeon.scatterVZ = (awayZ / len) * NPC.pigeonScatterSpeed
      + randomRange(-1, 1, seed + 1);
    pigeon.scatterVY = NPC.pigeonScatterSpeed * randomRange(0.6, 1.0, seed + 2);
  }
}

// ─── Public API ─────────────────────────────────────────────────

export function initPigeons(
  pedRoutes: readonly RouteSegment[],
  playerX: number,
  playerZ: number,
): void {
  routes = pedRoutes as RouteSegment[];
  groups = [];
  spawnCounter = 0;

  for (let i = 0; i < NPC.pigeonGroupCount; i++) {
    groups.push(spawnGroup(playerX, playerZ));
  }
  initialized = true;
}

export function tickPigeons(delta: number, playerX: number, playerZ: number): void {
  if (!initialized) return;

  const scatterR2 = NPC.pigeonScatterDist * NPC.pigeonScatterDist;
  const cullR2 = NPC.cullRadius * NPC.cullRadius;

  for (const group of groups) {
    switch (group.state) {
      case 'pecking': {
        // Check player proximity → scatter
        const d2 = distSq(group.centerX, group.centerZ, playerX, playerZ);
        if (d2 < scatterR2) {
          triggerScatter(group, playerX, playerZ);
          break;
        }

        // Cull if too far
        if (d2 > cullR2) {
          group.state = 'gone';
          group.stateTimer = 0;
          break;
        }

        // Update each pigeon idle behavior
        for (const pigeon of group.pigeons) {
          // Wander direction change
          pigeon.wanderTimer -= delta;
          if (pigeon.wanderTimer <= 0) {
            pigeon.wanderAngle = seededRandom(++spawnCounter) * TWO_PI;
            pigeon.wanderTimer = randomRange(1.5, 4, spawnCounter);
          }

          // Shuffle walk
          pigeon.localX += Math.cos(pigeon.wanderAngle) * NPC.pigeonWalkSpeed * delta;
          pigeon.localZ += Math.sin(pigeon.wanderAngle) * NPC.pigeonWalkSpeed * delta;

          // Clamp to group radius
          const dist = Math.sqrt(pigeon.localX * pigeon.localX + pigeon.localZ * pigeon.localZ);
          if (dist > NPC.pigeonWalkRadius) {
            pigeon.localX *= NPC.pigeonWalkRadius / dist;
            pigeon.localZ *= NPC.pigeonWalkRadius / dist;
            pigeon.wanderAngle += Math.PI;
          }

          // Head peck bob
          pigeon.peckPhase += NPC.pigeonPeckSpeed * TWO_PI * delta;
          pigeon.headY = (Math.sin(pigeon.peckPhase) - 1) * 0.5 * NPC.pigeonPeckAmplitude;

          // Slight wing fidget at rest
          pigeon.wingPhase += NPC.pigeonFlapSpeedGround * delta;
          pigeon.wingAngle = Math.sin(pigeon.wingPhase) * 0.1;
        }
        break;
      }

      case 'scattering': {
        group.stateTimer += delta;

        for (const pigeon of group.pigeons) {
          // Fly outward
          pigeon.localX += pigeon.scatterVX * delta;
          pigeon.localZ += pigeon.scatterVZ * delta;
          pigeon.headY = 0;

          // Fast wing flap
          pigeon.wingPhase += NPC.pigeonFlapSpeedScatter * delta;
          pigeon.wingAngle = Math.sin(pigeon.wingPhase) * 0.6;
        }

        if (group.stateTimer >= NPC.pigeonScatterDuration) {
          group.state = 'gone';
          group.stateTimer = 0;
        }
        break;
      }

      case 'gone': {
        // Respawn at a new position near the player
        const fresh = spawnGroup(playerX, playerZ);
        group.centerX = fresh.centerX;
        group.centerZ = fresh.centerZ;
        group.groundY = fresh.groundY;
        group.state = 'pecking';
        group.stateTimer = 0;
        group.pigeons = fresh.pigeons;
        break;
      }
    }
  }
}

export function getPigeonGroups(): readonly PigeonGroup[] {
  return groups;
}

export function isPigeonsInitialized(): boolean {
  return initialized;
}
