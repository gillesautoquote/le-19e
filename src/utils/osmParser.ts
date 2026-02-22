import {
  isBuilding,
  isWaterway,
  isLock,
  isPark,
  isRoad,
  isBench,
  isLamp,
  isFountain,
  isVelib,
  isBusStop,
  isTrafficLight,
  isShop,
  isBarge,
  isWasteBin,
  isTree,
} from '@/utils/osmDetectors';
import {
  parseBuilding,
  parseWaterway,
  parsePark,
  parseRoad,
  parseBench,
  parseLamp,
  parseFountain,
  parseVelib,
  parseBusStop,
  parseTrafficLight,
  parseShop,
} from '@/utils/osmParsers';
import {
  parseBarge,
  parseLock,
  parseWasteBin,
  parseTree,
} from '@/utils/osmParsersExtra';
import type {
  GeoJSONCollection,
  OSMBuilding,
  OSMWaterway,
  OSMPark,
  OSMRoad,
  OSMBench,
  OSMLamp,
  OSMFountain,
  OSMVelib,
  OSMBusStop,
  OSMTrafficLight,
  OSMShop,
  OSMBarge,
  OSMLock,
  OSMWasteBin,
  OSMTree,
  OSMData,
} from '@/types/osm';

// Re-export for consumers that import resolveFeatureId from this module
export { resolveFeatureId } from '@/utils/osmDetectors';

/**
 * Parse a GeoJSON FeatureCollection from OSM data into typed domain objects.
 * Separates features by type and cleans up missing data.
 */
export function parseOSMGeoJSON(geojson: GeoJSONCollection): OSMData {
  const buildings: OSMBuilding[] = [];
  const waterways: OSMWaterway[] = [];
  const parks: OSMPark[] = [];
  const roads: OSMRoad[] = [];
  const benches: OSMBench[] = [];
  const lamps: OSMLamp[] = [];
  const fountains: OSMFountain[] = [];
  const velibs: OSMVelib[] = [];
  const busStops: OSMBusStop[] = [];
  const trafficLights: OSMTrafficLight[] = [];
  const shops: OSMShop[] = [];
  const barges: OSMBarge[] = [];
  const locks: OSMLock[] = [];
  const wasteBins: OSMWasteBin[] = [];
  const trees: OSMTree[] = [];

  for (const feature of geojson.features) {
    // Polygon-based features
    if (isBuilding(feature)) {
      const b = parseBuilding(feature);
      if (b) buildings.push(b);
    } else if (isPark(feature)) {
      const p = parsePark(feature);
      if (p) parks.push(p);
    }
    // LineString-based features
    else if (isWaterway(feature)) {
      const w = parseWaterway(feature);
      if (w) waterways.push(w);
    } else if (isRoad(feature)) {
      const r = parseRoad(feature);
      if (r) roads.push(r);
    }
    // Point-based features
    else if (isLock(feature)) {
      const l = parseLock(feature);
      if (l) locks.push(l);
    } else if (isBench(feature)) {
      const b = parseBench(feature);
      if (b) benches.push(b);
    } else if (isLamp(feature)) {
      const l = parseLamp(feature);
      if (l) lamps.push(l);
    } else if (isFountain(feature)) {
      const f = parseFountain(feature);
      if (f) fountains.push(f);
    } else if (isVelib(feature)) {
      const v = parseVelib(feature);
      if (v) velibs.push(v);
    } else if (isBusStop(feature)) {
      const b = parseBusStop(feature);
      if (b) busStops.push(b);
    } else if (isTrafficLight(feature)) {
      const t = parseTrafficLight(feature);
      if (t) trafficLights.push(t);
    } else if (isShop(feature)) {
      const s = parseShop(feature);
      if (s) shops.push(s);
    } else if (isBarge(feature)) {
      const b = parseBarge(feature);
      if (b) barges.push(b);
    } else if (isWasteBin(feature)) {
      const w = parseWasteBin(feature);
      if (w) wasteBins.push(w);
    } else if (isTree(feature)) {
      const t = parseTree(feature);
      if (t) trees.push(t);
    }
  }

  return {
    buildings, waterways, parks, roads,
    benches, lamps, fountains, velibs,
    busStops, trafficLights, shops, barges,
    locks, wasteBins, trees,
  };
}
