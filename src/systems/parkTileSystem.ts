import {
  PARK_BASE_TILES,
  PARK_BASE_WEIGHTS,
  PARK_WALL_STRAIGHT,
  PARK_WALL_ENTRY,
  NATIVE_TILE_SIZE,
} from '@/constants/kaykitParks';
import type { KaykitParkTileDef } from '@/constants/kaykitParks';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { seededRandom } from '@/systems/npcRoutes';
import type { ScenePark } from '@/types/osm';

export interface ParkTileInstance {
  x: number;
  z: number;
  y: number;
  rotationY: number;
  scale: number;
}

/** Tile scale: native 2 units → desired world size in metres. */
const TILE_WORLD_SIZE = 4.0;
const TILE_SCALE = TILE_WORLD_SIZE / NATIVE_TILE_SIZE;

/** Native tile top surface is at Y=0.1; scaled it's at 0.1 × TILE_SCALE.
 *  Offset Y down so the grass surface sits flush with terrain. */
const TILE_SURFACE_Y = 0.1 * TILE_SCALE; // 0.2m

/** Ray-casting point-in-polygon test (2D). */
function pointInPolygon(x: number, z: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], zi = polygon[i][1];
    const xj = polygon[j][0], zj = polygon[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Pick an index from weighted distribution. */
function pickWeighted(seed: number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  const roll = (seededRandom(seed) * total) | 0;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (roll < acc) return i;
  }
  return weights.length - 1;
}

/** Compute base ground tile instances for all parks. */
export function computeParkBaseTiles(
  parks: ScenePark[],
): Map<string, ParkTileInstance[]> {
  const groups = new Map<string, ParkTileInstance[]>();
  for (const def of PARK_BASE_TILES) groups.set(def.key, []);

  let seed = 20000;

  for (const park of parks) {
    if (park.polygon.length < 3) continue;

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const [px, pz] of park.polygon) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    }

    // Align grid to tile size, offset by half to center tiles
    const startX = Math.floor(minX / TILE_WORLD_SIZE) * TILE_WORLD_SIZE;
    const startZ = Math.floor(minZ / TILE_WORLD_SIZE) * TILE_WORLD_SIZE;

    for (let gx = startX; gx <= maxX; gx += TILE_WORLD_SIZE) {
      for (let gz = startZ; gz <= maxZ; gz += TILE_WORLD_SIZE) {
        // Center of tile
        const cx = gx + TILE_WORLD_SIZE * 0.5;
        const cz = gz + TILE_WORLD_SIZE * 0.5;

        if (!pointInPolygon(cx, cz, park.polygon)) continue;

        seed++;
        const variantIdx = pickWeighted(seed, PARK_BASE_WEIGHTS);
        const def = PARK_BASE_TILES[variantIdx];

        // Slight random rotation (0°, 90°, 180°, 270°) for variety
        const rotStep = (seededRandom(seed + 1000) * 4) | 0;
        const rotationY = rotStep * (Math.PI / 2);

        groups.get(def.key)!.push({
          x: cx,
          z: cz,
          y: getTerrainHeight(cx, cz) - TILE_SURFACE_Y + 0.02,
          rotationY,
          scale: TILE_SCALE,
        });
      }
    }
  }

  return groups;
}

/** Half-tile inset at each vertex to avoid overlap between adjacent edges. */
const VERTEX_INSET = TILE_WORLD_SIZE * 0.5;

/** Compute wall tile instances along park polygon edges.
 *  Corner tiles are skipped — OSM polygons have arbitrary angles
 *  that don't match KayKit's 90° grid corners. */
export function computeParkWallTiles(
  parks: ScenePark[],
): Map<string, ParkTileInstance[]> {
  const wallDef = PARK_WALL_STRAIGHT;
  const entryDef = PARK_WALL_ENTRY;

  const groups = new Map<string, ParkTileInstance[]>();
  groups.set(wallDef.key, []);
  groups.set(entryDef.key, []);

  let seed = 25000;

  for (const park of parks) {
    const pts = park.polygon;
    if (pts.length < 3) continue;

    // Compute total perimeter and decide entry placement
    let perimeter = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[(i + 1) % pts.length];
      perimeter += Math.sqrt((x1 - x0) ** 2 + (z1 - z0) ** 2);
    }

    seed++;
    const entryDist = seededRandom(seed) * perimeter;
    let entryPlaced = false;

    let accumDist = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[(i + 1) % pts.length];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const edgeLen = Math.sqrt(dx * dx + dz * dz);
      if (edgeLen < TILE_WORLD_SIZE) continue;

      // Straight wall: model Z runs along edge → atan2(dx,dz) aligns correctly
      const wallAngle = Math.atan2(dx, dz);
      // Entry gate: model X runs along edge → needs -π/2 extra rotation
      const entryAngle = wallAngle - Math.PI / 2;

      // Inset from both vertices to avoid overlap at polygon corners
      let dist = VERTEX_INSET;
      const edgeEnd = edgeLen - VERTEX_INSET;

      while (dist < edgeEnd) {
        const t = dist / edgeLen;
        const wx = x0 + dx * t;
        const wz = z0 + dz * t;

        const totalDist = accumDist + dist;
        const isEntry = !entryPlaced && totalDist >= entryDist;

        if (isEntry) {
          entryPlaced = true;
          groups.get(entryDef.key)!.push({
            x: wx, z: wz,
            y: getTerrainHeight(wx, wz) - TILE_SURFACE_Y + 0.02,
            rotationY: entryAngle,
            scale: TILE_SCALE,
          });
        } else {
          groups.get(wallDef.key)!.push({
            x: wx, z: wz,
            y: getTerrainHeight(wx, wz) - TILE_SURFACE_Y + 0.02,
            rotationY: wallAngle,
            scale: TILE_SCALE,
          });
        }

        dist += TILE_WORLD_SIZE;
      }

      accumDist += edgeLen;
    }
  }

  return groups;
}

/** All unique tile defs used by the system (for iteration). */
export function getAllUsedDefs(): KaykitParkTileDef[] {
  return [
    ...PARK_BASE_TILES,
    PARK_WALL_STRAIGHT,
    PARK_WALL_ENTRY,
  ];
}
