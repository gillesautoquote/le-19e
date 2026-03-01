/**
 * dustSystem.ts — State management & tick logic for floating dust/pollen particles.
 *
 * Module-level state for zero re-render overhead.
 * DustParticles.tsx calls tickDust() from useFrame, reads via getDust().
 */
import { DUST } from '@/constants/dust';
import { seededRandom, randomRange } from '@/systems/npcRoutes';
import { getTerrainHeight } from '@/systems/terrainSystem';

const TWO_PI = Math.PI * 2;

// ─── Dust particle type ─────────────────────────────────────────

interface DustMote {
  offsetX: number;
  offsetZ: number;
  riseSpeed: number;
  wobblePhaseX: number;
  wobblePhaseZ: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  localTime: number;
}

// ─── Module-level state ─────────────────────────────────────────

let motes: DustMote[] = [];
let initialized = false;
let spawnSeed = 50000; // offset from leaf seeds
let globalTime = 0;

// ─── Spawn a single mote ───────────────────────────────────────

function spawnMote(px: number, pz: number): DustMote {
  const seed = ++spawnSeed;
  const angle = seededRandom(seed) * TWO_PI;
  const radius = randomRange(DUST.spawnMinRadius, DUST.spawnRadius, seed + 1);
  const offsetX = Math.cos(angle) * radius;
  const offsetZ = Math.sin(angle) * radius;
  const worldX = px + offsetX;
  const worldZ = pz + offsetZ;
  const terrainY = getTerrainHeight(worldX, worldZ);
  const spawnY = terrainY + randomRange(DUST.heightMin, DUST.heightMax, seed + 2);

  return {
    offsetX,
    offsetZ,
    riseSpeed: randomRange(DUST.riseSpeedMin, DUST.riseSpeedMax, seed + 3),
    wobblePhaseX: seededRandom(seed + 4) * TWO_PI,
    wobblePhaseZ: seededRandom(seed + 5) * TWO_PI,
    worldX,
    worldY: spawnY,
    worldZ,
    localTime: randomRange(0, 20, seed + 6),
  };
}

function respawnMote(mote: DustMote, px: number, pz: number): void {
  const fresh = spawnMote(px, pz);
  // Start from near ground level
  const terrainY = getTerrainHeight(fresh.worldX, fresh.worldZ);
  fresh.worldY = terrainY + DUST.heightMin;
  fresh.localTime = 0;
  Object.assign(mote, fresh);
}

// ─── Public API ─────────────────────────────────────────────────

export function initDust(playerX: number, playerZ: number): void {
  motes = [];
  spawnSeed = 50000;
  globalTime = 0;
  for (let i = 0; i < DUST.count; i++) {
    motes.push(spawnMote(playerX, playerZ));
  }
  initialized = true;
}

export function tickDust(delta: number, playerX: number, playerZ: number): void {
  if (!initialized) return;
  globalTime += delta;

  const globalDriftX = Math.sin(globalTime * DUST.wobbleFreq * TWO_PI) * DUST.driftSpeed;
  const cullDist = DUST.spawnRadius * DUST.cullMultiplier;
  const cullR2 = cullDist * cullDist;

  for (const mote of motes) {
    mote.localTime += delta;

    // Slow rise
    mote.worldY += mote.riseSpeed * delta;

    // Wobble around anchor
    const anchorX = playerX + mote.offsetX;
    const anchorZ = playerZ + mote.offsetZ;
    const wobbleX = Math.sin(mote.localTime * DUST.wobbleFreq * TWO_PI + mote.wobblePhaseX)
      * DUST.wobbleAmplitude;
    const wobbleZ = Math.cos(mote.localTime * DUST.wobbleFreq * TWO_PI + mote.wobblePhaseZ)
      * DUST.wobbleAmplitude * 0.5;

    mote.worldX = anchorX + wobbleX + globalDriftX;
    mote.worldZ = anchorZ + wobbleZ;

    // Respawn when too high
    const terrainY = getTerrainHeight(mote.worldX, mote.worldZ);
    if (mote.worldY > terrainY + DUST.heightMax) {
      respawnMote(mote, playerX, playerZ);
      continue;
    }

    // Cull if drifted too far from player
    const dx = mote.worldX - playerX;
    const dz = mote.worldZ - playerZ;
    if (dx * dx + dz * dz > cullR2) {
      respawnMote(mote, playerX, playerZ);
    }
  }
}

export function getDust(): readonly DustMote[] {
  return motes;
}

export function isDustInitialized(): boolean {
  return initialized;
}
