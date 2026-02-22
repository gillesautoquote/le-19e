import { gpsToScene, getBuildingHeight, getBuildingColor, hashBuildingColor } from '@/utils/geoUtils';
import type {
  GeoJSONCollection,
  OSMData,
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
  SceneObjects,
  ParisTreeCollection,
  ParisTree,
} from '@/types/osm';

// ─── GPS → Scene point helper ────────────────────────────────────

function toScenePos(lat: number, lng: number): [number, number] {
  const [x, , z] = gpsToScene(lat, lng);
  return [x, z];
}

// ─── OSM → Scene conversion ─────────────────────────────────────

export function convertToSceneObjects(osmData: OSMData, geojson: GeoJSONCollection): SceneObjects {
  const featureMap = new Map(
    geojson.features.map((f) => [f.properties.id, f])
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

// ─── Paris trees conversion ──────────────────────────────────────

export function convertParisTrees(raw: ParisTreeCollection): ParisTree[] {
  return raw.trees.map((t) => ({
    id: t.id,
    position: [t.lat, t.lng] as [number, number],
    species: t.species,
    commonName: t.commonName,
    height: t.height,
    circumference: t.circumference,
    plantYear: t.plantYear,
  }));
}

export function parisTreestoSceneTrees(parisTrees: ParisTree[]): SceneTree[] {
  return parisTrees.map((t) => ({
    id: `paris-tree-${t.id}`,
    position: toScenePos(t.position[0], t.position[1]),
    height: t.height,
    species: t.species,
    commonName: t.commonName,
  }));
}
