import { BufferGeometry, Float32BufferAttribute } from 'three';
import type {
  SceneObjects, ScenePark,
  SceneBench, SceneLamp, SceneFountain, SceneVelib,
  SceneBusStop, SceneTrafficLight, SceneShop, SceneBarge,
  SceneLock, SceneWasteBin, SceneTree,
} from '@/types/osm';
import { waterwayToGeometry, roadToGeometry } from '@/systems/ribbonGeometry';
import type { WaterwayGeometryResult, RoadGeometryResult } from '@/systems/ribbonGeometry';

// Re-export from split modules so existing imports keep working
export { waterwayToGeometry, roadToGeometry } from '@/systems/ribbonGeometry';
export type { WaterwayGeometryResult, RoadGeometryResult } from '@/systems/ribbonGeometry';

// ─── Park geometry ───────────────────────────────────────────────

export interface ParkGeometryResult {
  geometry: BufferGeometry;
  id: string;
  centroid: [number, number];
}

/**
 * Create a flat polygon geometry for a park.
 * Uses simple ear-clipping fan triangulation (sufficient for convex-ish parks).
 */
export function parkToGeometry(park: ScenePark): ParkGeometryResult {
  const pts = park.polygon;

  // Remove closing point if duplicate
  const polygon = pts.length > 1 &&
    pts[0][0] === pts[pts.length - 1][0] &&
    pts[0][1] === pts[pts.length - 1][1]
    ? pts.slice(0, -1)
    : pts;

  const vertices: number[] = [];
  const indices: number[] = [];

  for (const [x, z] of polygon) {
    vertices.push(x, 0.01, z); // slightly above ground
  }

  // Fan triangulation from first vertex
  for (let i = 1; i < polygon.length - 1; i++) {
    indices.push(0, i, i + 1);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  let cx = 0;
  let cz = 0;
  for (const [x, z] of polygon) {
    cx += x;
    cz += z;
  }
  cx /= polygon.length;
  cz /= polygon.length;

  return { geometry, id: park.id, centroid: [cx, cz] };
}

// ─── Full scene generation ───────────────────────────────────────

export interface GeneratedScene {
  waterways: WaterwayGeometryResult[];
  roads: RoadGeometryResult[];
  parks: ParkGeometryResult[];
  // Point-based objects are passed through as-is (atoms handle their own geometry)
  benches: SceneBench[];
  lamps: SceneLamp[];
  fountains: SceneFountain[];
  velibs: SceneVelib[];
  busStops: SceneBusStop[];
  trafficLights: SceneTrafficLight[];
  shops: SceneShop[];
  barges: SceneBarge[];
  locks: SceneLock[];
  wasteBins: SceneWasteBin[];
  trees: SceneTree[];
}

/**
 * Generate all Three.js geometries from parsed scene objects.
 * Buildings are handled separately by OSMBuildings (merged ExtrudeGeometry).
 * Polygon/line features get converted to geometries.
 * Point features are passed through for atoms to render.
 */
export function generateSceneObjects(sceneObjects: SceneObjects): GeneratedScene {
  return {
    waterways: sceneObjects.water.map(waterwayToGeometry),
    roads: sceneObjects.roads.map(roadToGeometry),
    parks: sceneObjects.parks.map(parkToGeometry),
    benches: sceneObjects.benches,
    lamps: sceneObjects.lamps,
    fountains: sceneObjects.fountains,
    velibs: sceneObjects.velibs,
    busStops: sceneObjects.busStops,
    trafficLights: sceneObjects.trafficLights,
    shops: sceneObjects.shops,
    barges: sceneObjects.barges,
    locks: sceneObjects.locks,
    wasteBins: sceneObjects.wasteBins,
    trees: sceneObjects.trees,
  };
}
