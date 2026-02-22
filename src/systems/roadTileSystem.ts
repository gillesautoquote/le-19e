import { getTerrainHeight } from '@/systems/terrainSystem';
import type { SceneRoad } from '@/types/osm';

export interface TileInstance {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scaleX: number;
  scaleZ: number;
}

/** Spacing between tile centers (scene units = meters). */
const TILE_SPACING = 2.0;

/** How far apart to place pedestrian crossings on a road (meters). */
const CROSSING_INTERVAL = 80;

/** Sidewalk width (meters). */
const SIDEWALK_WIDTH = 2.5;

/** Road types that get sidewalks + crossings. */
const VEHICLE_ROAD_TYPES: ReadonlySet<string> = new Set([
  'primary', 'secondary', 'tertiary', 'residential',
]);

/** Road types that get raised sidewalks on both sides. */
const SIDEWALK_ROAD_TYPES: ReadonlySet<string> = new Set([
  'primary', 'secondary',
]);

// ─── Helpers ────────────────────────────────────────────────────────

interface Segment {
  x1: number; z1: number;
  dx: number; dz: number;
  len: number;
  angle: number;
  nx: number; nz: number;
}

/**
 * Kenney road tiles have the road running along the model's X axis.
 * atan2(dx,dz) aligns model Z with road direction, so we subtract PI/2
 * to align model X with road direction instead. Scales are also swapped:
 * scaleX = along road (TILE_SPACING), scaleZ = across road (road width).
 */
const HALF_PI = Math.PI / 2;

function segmentFromPoints(p1: [number, number], p2: [number, number]): Segment | null {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len < 0.1) return null;
  return {
    x1: p1[0], z1: p1[1],
    dx, dz, len,
    angle: Math.atan2(dx, dz) - HALF_PI,
    nx: -dz / len,
    nz: dx / len,
  };
}

// ─── Main function ──────────────────────────────────────────────────

export interface RoadTileResult {
  crossingTiles: TileInstance[];
  sidewalkTiles: TileInstance[];
}

/**
 * Compute Kenney tile instances for crossings and sidewalks.
 * Road surfaces are rendered as procedural ribbons (not tiles).
 */
export function computeRoadTiles(roads: SceneRoad[]): RoadTileResult {
  const crossingTiles: TileInstance[] = [];
  const sidewalkTiles: TileInstance[] = [];

  for (const road of roads) {
    if (!VEHICLE_ROAD_TYPES.has(road.type)) continue;
    if (road.points.length < 2) continue;

    const hasSidewalk = SIDEWALK_ROAD_TYPES.has(road.type);
    const halfW = road.width / 2;
    const swOffset = halfW + SIDEWALK_WIDTH / 2;

    let accumulated = 0;
    let totalDistance = 0;

    for (let i = 0; i < road.points.length - 1; i++) {
      const seg = segmentFromPoints(road.points[i], road.points[i + 1]);
      if (!seg) continue;

      while (accumulated < seg.len) {
        const t = accumulated / seg.len;
        const px = seg.x1 + seg.dx * t;
        const pz = seg.z1 + seg.dz * t;

        // Crossing tiles at regular intervals
        const distMod = totalDistance + accumulated;
        const isCrossing = distMod > 0 &&
          Math.abs(distMod % CROSSING_INTERVAL) < TILE_SPACING;

        if (isCrossing) {
          crossingTiles.push({
            x: px, y: getTerrainHeight(px, pz), z: pz,
            rotationY: seg.angle,
            scaleX: TILE_SPACING,
            scaleZ: road.width,
          });
        }

        // Sidewalk tiles on both sides
        if (hasSidewalk) {
          const swLx = px + seg.nx * swOffset;
          const swLz = pz + seg.nz * swOffset;
          const swRx = px - seg.nx * swOffset;
          const swRz = pz - seg.nz * swOffset;
          sidewalkTiles.push(
            {
              x: swLx, y: getTerrainHeight(swLx, swLz), z: swLz,
              rotationY: seg.angle,
              scaleX: TILE_SPACING,
              scaleZ: SIDEWALK_WIDTH,
            },
            {
              x: swRx, y: getTerrainHeight(swRx, swRz), z: swRz,
              rotationY: seg.angle,
              scaleX: TILE_SPACING,
              scaleZ: SIDEWALK_WIDTH,
            },
          );
        }

        accumulated += TILE_SPACING;
      }
      accumulated -= seg.len;
      totalDistance += seg.len;
    }
  }

  return { crossingTiles, sidewalkTiles };
}

// ─── Road surface tiles ─────────────────────────────────────────────

/** Y offset for road surface tiles (just above terrain). */
const ROAD_SURFACE_Y_OFFSET = 0.04;

/**
 * Compute Kenney tile instances for road surfaces (asphalt).
 * Same polyline-sampling algorithm as crossings/sidewalks.
 */
export function computeRoadSurfaceTiles(roads: SceneRoad[]): TileInstance[] {
  const tiles: TileInstance[] = [];

  for (const road of roads) {
    if (!VEHICLE_ROAD_TYPES.has(road.type)) continue;
    if (road.points.length < 2) continue;

    let accumulated = 0;

    for (let i = 0; i < road.points.length - 1; i++) {
      const seg = segmentFromPoints(road.points[i], road.points[i + 1]);
      if (!seg) continue;

      while (accumulated < seg.len) {
        const t = accumulated / seg.len;
        const px = seg.x1 + seg.dx * t;
        const pz = seg.z1 + seg.dz * t;

        tiles.push({
          x: px,
          y: getTerrainHeight(px, pz) + ROAD_SURFACE_Y_OFFSET,
          z: pz,
          rotationY: seg.angle,
          scaleX: TILE_SPACING,
          scaleZ: road.width,
        });

        accumulated += TILE_SPACING;
      }
      accumulated -= seg.len;
    }
  }

  return tiles;
}
