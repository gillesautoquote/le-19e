import { parseOSMGeoJSON, resolveFeatureId } from '@/utils/osmParser';
import { gpsToScene, getBuildingHeight, getBuildingColor, hashBuildingColor } from '@/utils/geoUtils';
import type {
  GeoJSONCollection,
  SceneObjects,
  SceneBuilding,
  SceneWater,
  ScenePark,
  SceneRoad,
  SceneBench,
  SceneLamp,
  SceneFountain,
  SceneVelib,
  SceneBusStop,
  SceneTrafficLight,
  SceneShop,
  SceneBarge,
  SceneLock,
  SceneWasteBin,
  SceneTree,
} from '@/types/osm';

// ─── GPS → Scene point helper (same as useOSMData) ─────────────

function toScenePos(lat: number, lng: number): [number, number] {
  const [x, , z] = gpsToScene(lat, lng);
  return [x, z];
}

// ─── Convert a tile's GeoJSON → SceneObjects ────────────────────

export function tileToSceneObjects(geojson: GeoJSONCollection): SceneObjects {
  const osmData = parseOSMGeoJSON(geojson);

  const featureMap = new Map(
    geojson.features.map((f) => [resolveFeatureId(f), f]),
  );

  const buildings: SceneBuilding[] = osmData.buildings.map((b) => {
    const feature = featureMap.get(b.id);
    return {
      id: b.id,
      type: b.type,
      polygon: b.coordinates.map(([lat, lng]) => toScenePos(lat, lng)),
      height: feature ? getBuildingHeight(feature) : b.height,
      color: feature ? getBuildingColor(feature) : hashBuildingColor(b.id),
      name: b.name,
    };
  });

  const water: SceneWater[] = osmData.waterways.map((w) => ({
    id: w.id,
    points: w.coordinates.map(([lat, lng]) => toScenePos(lat, lng)),
    width: w.width,
    name: w.name,
  }));

  const parks: ScenePark[] = osmData.parks.map((p) => ({
    id: p.id,
    polygon: p.coordinates.map(([lat, lng]) => toScenePos(lat, lng)),
    name: p.name,
  }));

  const roads: SceneRoad[] = osmData.roads.map((r) => ({
    id: r.id,
    type: r.type,
    points: r.coordinates.map(([lat, lng]) => toScenePos(lat, lng)),
    width: r.width,
    name: r.name,
  }));

  const benches: SceneBench[] = osmData.benches.map((b) => ({
    id: b.id,
    position: toScenePos(b.position[0], b.position[1]),
    orientation: (b.orientation * Math.PI) / 180,
  }));

  const lamps: SceneLamp[] = osmData.lamps.map((l) => ({
    id: l.id,
    position: toScenePos(l.position[0], l.position[1]),
    height: l.height,
  }));

  const fountains: SceneFountain[] = osmData.fountains.map((f) => ({
    id: f.id,
    position: toScenePos(f.position[0], f.position[1]),
    type: f.type,
  }));

  const velibs: SceneVelib[] = osmData.velibs.map((v) => ({
    id: v.id,
    position: toScenePos(v.position[0], v.position[1]),
    stationId: v.stationId,
    name: v.name,
    capacity: v.capacity,
  }));

  const busStops: SceneBusStop[] = osmData.busStops.map((b) => ({
    id: b.id,
    position: toScenePos(b.position[0], b.position[1]),
    name: b.name,
    lines: b.lines,
  }));

  const trafficLights: SceneTrafficLight[] = osmData.trafficLights.map((t) => ({
    id: t.id,
    position: toScenePos(t.position[0], t.position[1]),
  }));

  const shops: SceneShop[] = osmData.shops.map((s) => ({
    id: s.id,
    position: toScenePos(s.position[0], s.position[1]),
    name: s.name,
    type: s.type,
  }));

  const barges: SceneBarge[] = osmData.barges.map((b) => ({
    id: b.id,
    position: toScenePos(b.position[0], b.position[1]),
    length: b.length,
    name: b.name,
    isTourBoat: b.isTourBoat,
  }));

  const locks: SceneLock[] = osmData.locks.map((l) => ({
    id: l.id,
    position: toScenePos(l.position[0], l.position[1]),
    name: l.name,
  }));

  const wasteBins: SceneWasteBin[] = osmData.wasteBins.map((w) => ({
    id: w.id,
    position: toScenePos(w.position[0], w.position[1]),
  }));

  const trees: SceneTree[] = osmData.trees.map((t) => ({
    id: t.id,
    position: toScenePos(t.position[0], t.position[1]),
    height: 10,
    species: '',
    commonName: '',
  }));

  return {
    buildings, water, parks, roads,
    benches, lamps, fountains, velibs,
    busStops, trafficLights, shops, barges,
    locks, wasteBins, trees,
  };
}

// ─── Merge multiple SceneObjects into one ───────────────────────

/** Push items into target array, skipping duplicates by id */
function pushUnique<T extends { id: string }>(
  target: T[],
  source: T[],
  seen: Set<string>,
): void {
  for (const item of source) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      target.push(item);
    }
  }
}

export function mergeSceneObjects(tiles: Map<string, SceneObjects>): SceneObjects {
  const merged: SceneObjects = {
    buildings: [], water: [], parks: [], roads: [],
    benches: [], lamps: [], fountains: [], velibs: [],
    busStops: [], trafficLights: [], shops: [], barges: [],
    locks: [], wasteBins: [], trees: [],
  };

  // Track seen IDs to deduplicate features that span multiple tiles
  const seen = {
    buildings: new Set<string>(),
    water: new Set<string>(),
    parks: new Set<string>(),
    roads: new Set<string>(),
    benches: new Set<string>(),
    lamps: new Set<string>(),
    fountains: new Set<string>(),
    velibs: new Set<string>(),
    busStops: new Set<string>(),
    trafficLights: new Set<string>(),
    shops: new Set<string>(),
    barges: new Set<string>(),
    locks: new Set<string>(),
    wasteBins: new Set<string>(),
    trees: new Set<string>(),
  };

  for (const objects of tiles.values()) {
    pushUnique(merged.buildings, objects.buildings, seen.buildings);
    pushUnique(merged.water, objects.water, seen.water);
    pushUnique(merged.parks, objects.parks, seen.parks);
    pushUnique(merged.roads, objects.roads, seen.roads);
    pushUnique(merged.benches, objects.benches, seen.benches);
    pushUnique(merged.lamps, objects.lamps, seen.lamps);
    pushUnique(merged.fountains, objects.fountains, seen.fountains);
    pushUnique(merged.velibs, objects.velibs, seen.velibs);
    pushUnique(merged.busStops, objects.busStops, seen.busStops);
    pushUnique(merged.trafficLights, objects.trafficLights, seen.trafficLights);
    pushUnique(merged.shops, objects.shops, seen.shops);
    pushUnique(merged.barges, objects.barges, seen.barges);
    pushUnique(merged.locks, objects.locks, seen.locks);
    pushUnique(merged.wasteBins, objects.wasteBins, seen.wasteBins);
    pushUnique(merged.trees, objects.trees, seen.trees);
  }

  return merged;
}

// ─── Empty scene objects (avoids re-allocations) ────────────────

export const EMPTY_SCENE: SceneObjects = {
  buildings: [], water: [], parks: [], roads: [],
  benches: [], lamps: [], fountains: [], velibs: [],
  busStops: [], trafficLights: [], shops: [], barges: [],
  locks: [], wasteBins: [], trees: [],
};
