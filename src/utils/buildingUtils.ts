import { hashString } from '@/utils/geoUtils';
import { KENNEY_COMMERCIAL, KENNEY_RESIDENTIAL } from '@/constants/kenneyBuildings';
import type { KenneyBuildingDef } from '@/constants/kenneyBuildings';
import type { OSMBuilding } from '@/types/osm';

/** Compute centroid of a 2D polygon [x, z][]. */
export function polygonCentroid(polygon: [number, number][]): [number, number] {
  let sx = 0;
  let sz = 0;
  for (const [x, z] of polygon) {
    sx += x;
    sz += z;
  }
  return [sx / polygon.length, sz / polygon.length];
}

/** Find the angle (radians) of the longest edge of a polygon. */
export function polygonPrincipalAngle(polygon: [number, number][]): number {
  let maxLen2 = 0;
  let angle = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const dx = polygon[j][0] - polygon[i][0];
    const dz = polygon[j][1] - polygon[i][1];
    const len2 = dx * dx + dz * dz;
    if (len2 > maxLen2) {
      maxLen2 = len2;
      angle = Math.atan2(dx, dz);
    }
  }
  return angle;
}

/**
 * Compute the oriented bounding box dimensions of a polygon
 * given its principal angle. Returns [width, depth].
 */
export function orientedBBoxSize(
  polygon: [number, number][],
  angle: number,
): [number, number] {
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  for (const [x, z] of polygon) {
    const u = x * cos - z * sin;
    const v = x * sin + z * cos;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  return [maxU - minU, maxV - minV];
}

/**
 * Compute the signed area of a 2D polygon using the shoelace formula.
 * Returns the absolute area.
 */
export function polygonArea(polygon: [number, number][]): number {
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * Compute a fill ratio: how much of the OBB the polygon actually fills.
 * Returns sqrt(polygonArea / obbArea), clamped to [0.5, 1.0].
 * Rectangular buildings ≈ 1.0, irregular shapes < 1.0.
 */
export function polygonFillRatio(
  polygon: [number, number][],
  obbWidth: number,
  obbDepth: number,
): number {
  const obbArea = obbWidth * obbDepth;
  if (obbArea <= 0) return 1;
  const pArea = polygonArea(polygon);
  const ratio = Math.sqrt(pArea / obbArea);
  return Math.max(0.5, Math.min(1.0, ratio));
}

/** Types that use modular residential buildings. */
const RESIDENTIAL_TYPES: ReadonlySet<string> = new Set(['residential', 'apartments']);

/**
 * Select the Kenney building model for a given building.
 * Residential/apartments use modular buildings (European style).
 * Commercial/industrial/yes use the commercial kit.
 */
export function selectBuildingModel(
  buildingId: string,
  buildingType: OSMBuilding['type'],
): KenneyBuildingDef {
  const h = hashString(buildingId);
  const pool = RESIDENTIAL_TYPES.has(buildingType)
    ? KENNEY_RESIDENTIAL
    : KENNEY_COMMERCIAL;
  return pool[h % pool.length];
}
