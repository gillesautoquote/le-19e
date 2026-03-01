/**
 * leafSystem.ts — State management & tick logic for falling leaf particles.
 *
 * Leaves spawn above nearby trees and fall through their canopy.
 * Module-level state for zero re-render overhead.
 * FallingLeaves.tsx calls tickLeaves() from useFrame, reads via getLeaves().
 */
import { LEAVES } from '@/constants/leaves';
import { seededRandom, randomRange } from '@/systems/npcRoutes';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { FallingLeaf } from '@/types/npc';

const TWO_PI = Math.PI * 2;

// ─── Tree anchor (lightweight subset of SceneTree) ──────────────

interface TreeAnchor {
  x: number;
  z: number;
  height: number;
}

// ─── Module-level state ─────────────────────────────────────────

let leaves: FallingLeaf[] = [];
let initialized = false;
let spawnSeed = 0;
let globalTime = 0;
let treeAnchors: TreeAnchor[] = [];
const nearbyBuffer: TreeAnchor[] = [];

// ─── Pick a random tree near the player ─────────────────────────

function pickNearbyTree(px: number, pz: number, seed: number): TreeAnchor | null {
  if (treeAnchors.length === 0) return null;

  const searchR2 = LEAVES.treeSearchRadius * LEAVES.treeSearchRadius;
  nearbyBuffer.length = 0;

  for (const tree of treeAnchors) {
    const dx = tree.x - px;
    const dz = tree.z - pz;
    if (dx * dx + dz * dz < searchR2) {
      nearbyBuffer.push(tree);
    }
  }

  if (nearbyBuffer.length === 0) return null;

  const idx = Math.floor(Math.abs(seededRandom(seed + 200)) * nearbyBuffer.length);
  return nearbyBuffer[Math.min(idx, nearbyBuffer.length - 1)];
}

// ─── Spawn a single leaf above a tree ───────────────────────────

function spawnLeaf(px: number, pz: number): FallingLeaf {
  const seed = ++spawnSeed;
  const tree = pickNearbyTree(px, pz, seed);

  if (!tree) {
    // No nearby tree — dormant leaf below terrain
    return {
      anchorX: px, anchorZ: pz, spawnY: -100,
      fallSpeed: 0.5, wobbleFreq: 0.5,
      wobblePhaseX: 0, wobblePhaseZ: 0,
      spinSpeed: 1, spinPhase: 0,
      colorVariant: 0, worldX: px, worldY: -100, worldZ: pz,
      localTime: 0, rotationY: 0, rotationZ: 0,
    };
  }

  // Random position within tree canopy
  const canopyR = tree.height * LEAVES.canopySpreadFrac;
  const angle = seededRandom(seed + 1) * TWO_PI;
  const r = seededRandom(seed + 2) * canopyR;
  const anchorX = tree.x + Math.cos(angle) * r;
  const anchorZ = tree.z + Math.sin(angle) * r;
  const terrainY = getTerrainHeight(anchorX, anchorZ);
  const spawnY = terrainY + tree.height * randomRange(
    LEAVES.spawnHeightFracMin, LEAVES.spawnHeightFracMax, seed + 3,
  );

  return {
    anchorX,
    anchorZ,
    spawnY,
    fallSpeed: randomRange(LEAVES.fallSpeedMin, LEAVES.fallSpeedMax, seed + 4),
    wobbleFreq: randomRange(LEAVES.wobbleFreqMin, LEAVES.wobbleFreqMax, seed + 5),
    wobblePhaseX: seededRandom(seed + 6) * TWO_PI,
    wobblePhaseZ: seededRandom(seed + 7) * TWO_PI,
    spinSpeed: randomRange(LEAVES.spinSpeedMin, LEAVES.spinSpeedMax, seed + 8),
    spinPhase: seededRandom(seed + 9) * TWO_PI,
    colorVariant: Math.abs(seed) % LEAVES.colorVariantCount,
    worldX: anchorX,
    worldY: spawnY,
    worldZ: anchorZ,
    localTime: randomRange(0, 10, seed + 10),
    rotationY: seededRandom(seed + 11) * TWO_PI,
    rotationZ: 0,
  };
}

function respawnLeaf(leaf: FallingLeaf, px: number, pz: number): void {
  const fresh = spawnLeaf(px, pz);
  fresh.localTime = 0;
  Object.assign(leaf, fresh);
}

// ─── Public API ─────────────────────────────────────────────────

export function initLeaves(
  playerX: number,
  playerZ: number,
  trees?: ReadonlyArray<{ position: [number, number]; height: number }>,
): void {
  // Convert SceneTree positions to lightweight anchors
  treeAnchors = (trees ?? []).map((t) => ({
    x: t.position[0],
    z: t.position[1],
    height: t.height || 8,
  }));

  leaves = [];
  spawnSeed = 0;
  globalTime = 0;
  for (let i = 0; i < LEAVES.count; i++) {
    leaves.push(spawnLeaf(playerX, playerZ));
  }
  initialized = true;
}

export function tickLeaves(delta: number, playerX: number, playerZ: number): void {
  if (!initialized) return;
  globalTime += delta;

  const globalBreezeX = Math.sin(globalTime * LEAVES.breezeFrequency * TWO_PI)
    * LEAVES.breezeStrength;
  const cullDistSq = LEAVES.spawnRadius * LEAVES.cullMultiplier;
  const cullR2 = cullDistSq * cullDistSq;

  for (const leaf of leaves) {
    // Dormant leaf (no tree nearby at spawn) — try respawn
    if (leaf.spawnY < -50) {
      respawnLeaf(leaf, playerX, playerZ);
      continue;
    }

    leaf.localTime += delta;

    // Fall
    leaf.worldY -= leaf.fallSpeed * delta;

    // Wobble around tree anchor (absolute position)
    const wobbleX = Math.sin(leaf.localTime * leaf.wobbleFreq * TWO_PI + leaf.wobblePhaseX)
      * LEAVES.wobbleAmplitude;
    const wobbleZ = Math.cos(leaf.localTime * leaf.wobbleFreq * TWO_PI + leaf.wobblePhaseZ)
      * LEAVES.wobbleAmplitude * 0.5;

    leaf.worldX = leaf.anchorX + wobbleX + globalBreezeX;
    leaf.worldZ = leaf.anchorZ + wobbleZ;

    // Tumble rotation
    leaf.rotationY = leaf.spinPhase + leaf.localTime * leaf.spinSpeed;
    leaf.rotationZ = Math.sin(leaf.localTime * leaf.wobbleFreq * TWO_PI) * 0.4;

    // Check terrain hit → respawn above a new tree
    const terrainY = getTerrainHeight(leaf.worldX, leaf.worldZ);
    if (leaf.worldY < terrainY) {
      respawnLeaf(leaf, playerX, playerZ);
      continue;
    }

    // Cull if drifted too far from player
    const dx = leaf.worldX - playerX;
    const dz = leaf.worldZ - playerZ;
    if (dx * dx + dz * dz > cullR2) {
      respawnLeaf(leaf, playerX, playerZ);
    }
  }
}

export function getLeaves(): readonly FallingLeaf[] {
  return leaves;
}

export function isLeavesInitialized(): boolean {
  return initialized;
}
