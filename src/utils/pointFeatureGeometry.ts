import {
  BoxGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Color,
  BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EPOCH_A } from '@/constants/epochs';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadSurfaceHeight } from '@/systems/roadTileSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';
import type {
  SceneFountain,
  SceneVelib,
  SceneBusStop,
  SceneLock,
} from '@/types/osm';

function colorize(geo: BufferGeometry, color: Color): void {
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
}

export interface MergedPointFeatureData {
  fountains: SceneFountain[];
  velibs: SceneVelib[];
  busStops: SceneBusStop[];
  locks: SceneLock[];
}

/**
 * Build merged geometry for point features that do NOT have GLB models.
 * Traffic lights, waste bins, and barges are now rendered as instanced GLBs.
 */
export function buildPointFeatureGeometry(data: MergedPointFeatureData): BufferGeometry | null {
  const { fountains, velibs, busStops, locks } = data;
  const geos: BufferGeometry[] = [];

  const wallaceColor = new Color(EPOCH_A.fountainWallace);
  const standardFountainColor = new Color(EPOCH_A.fountainStandard);
  const velibColor = new Color(EPOCH_A.velibStation);
  const shelterColor = new Color(EPOCH_A.busShelter);
  const lockColor = new Color(EPOCH_A.lockMetal);

  // Fountains — cylinder basin
  for (const f of fountains) {
    const [x, z] = f.position;
    const ty = Math.max(getTerrainHeight(x, z), getRoadSurfaceHeight(x, z), getRoadGradeHeight(x, z));
    const color = f.type === 'wallace' ? wallaceColor : standardFountainColor;
    const geo = new CylinderGeometry(0.6, 0.6, 1.0, 8);
    geo.translate(x, ty + 0.5, z);
    colorize(geo, color);
    geos.push(geo);
  }

  // Vélib stations — box borne
  for (const v of velibs) {
    const [x, z] = v.position;
    const ty = Math.max(getTerrainHeight(x, z), getRoadSurfaceHeight(x, z), getRoadGradeHeight(x, z));
    const geo = new BoxGeometry(1.5, 1.2, 0.4);
    geo.translate(x, ty + 0.6, z);
    colorize(geo, velibColor);
    geos.push(geo);
  }

  // Bus stops — box shelter
  for (const b of busStops) {
    const [x, z] = b.position;
    const ty = Math.max(getTerrainHeight(x, z), getRoadSurfaceHeight(x, z), getRoadGradeHeight(x, z));
    const geo = new BoxGeometry(2.0, 2.5, 0.5);
    geo.translate(x, ty + 1.25, z);
    colorize(geo, shelterColor);
    geos.push(geo);
  }

  // Locks — box gate (near water level)
  for (const l of locks) {
    const [x, z] = l.position;
    const geo = new BoxGeometry(4.0, 1.5, 1.0);
    geo.translate(x, 0.75, z);
    colorize(geo, lockColor);
    geos.push(geo);
  }

  if (geos.length === 0) return null;
  return mergeGeometries(geos, false);
}
