// ─── Raw GeoJSON types (from OSM export) ─────────────────────────

export interface GeoJSONGeometry {
  type: 'Polygon' | 'LineString' | 'MultiPolygon' | 'MultiLineString' | 'Point';
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

export interface GeoJSONProperties {
  id?: string;
  '@id'?: string;          // Overpass Turbo format: "way/26954399"
  building?: string;
  'building:levels'?: string;
  height?: string;
  name?: string;
  waterway?: string;
  leisure?: string;
  highway?: string;
  lanes?: string;
  surface?: string;
  [key: string]: string | undefined;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: GeoJSONProperties;
  geometry: GeoJSONGeometry;
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ─── Parsed OSM feature types ─────────────────────────────────────

export interface OSMBuilding {
  id: string;
  type: 'residential' | 'commercial' | 'apartments' | 'industrial' | 'yes';
  coordinates: [number, number][]; // [lat, lng][] polygon ring
  height: number;                  // meters
  levels: number;
  name: string | null;
}

export interface OSMWaterway {
  id: string;
  type: 'canal' | 'river' | 'stream';
  coordinates: [number, number][]; // [lat, lng][] linestring
  width: number;                   // meters (estimated if not in tags)
  name: string | null;
}

export interface OSMPark {
  id: string;
  coordinates: [number, number][]; // [lat, lng][] polygon ring
  name: string | null;
}

export interface OSMRoad {
  id: string;
  type: 'primary' | 'secondary' | 'tertiary' | 'residential' | 'footway' | 'cycleway';
  coordinates: [number, number][]; // [lat, lng][] linestring
  width: number;                   // meters
  name: string | null;
}

export interface OSMBench {
  id: string;
  position: [number, number]; // [lat, lng]
  orientation: number;        // degrees, 0 = north
}

export interface OSMLamp {
  id: string;
  position: [number, number]; // [lat, lng]
  height: number;             // meters (default 5)
}

export interface OSMFountain {
  id: string;
  position: [number, number]; // [lat, lng]
  type: 'wallace' | 'standard';
}

export interface OSMVelib {
  id: string;
  position: [number, number]; // [lat, lng]
  stationId: string;
  name: string;
  capacity: number;
}

export interface OSMBusStop {
  id: string;
  position: [number, number]; // [lat, lng]
  name: string;
  lines: string[];
}

export interface OSMTrafficLight {
  id: string;
  position: [number, number]; // [lat, lng]
}

export interface OSMShop {
  id: string;
  position: [number, number]; // [lat, lng]
  name: string;
  type: 'cafe' | 'restaurant' | 'bar' | 'bakery' | 'pharmacy' | 'convenience' | 'cinema' | 'other';
}

export interface OSMBarge {
  id: string;
  position: [number, number]; // [lat, lng]
  length: number;             // meters
  name: string | null;
  isTourBoat: boolean;
}

export interface OSMLock {
  id: string;
  position: [number, number]; // [lat, lng]
  name: string | null;
}

export interface OSMWasteBin {
  id: string;
  position: [number, number]; // [lat, lng]
}

export interface OSMTree {
  id: string;
  position: [number, number]; // [lat, lng]
}

export interface OSMData {
  buildings: OSMBuilding[];
  waterways: OSMWaterway[];
  parks: OSMPark[];
  roads: OSMRoad[];
  benches: OSMBench[];
  lamps: OSMLamp[];
  fountains: OSMFountain[];
  velibs: OSMVelib[];
  busStops: OSMBusStop[];
  trafficLights: OSMTrafficLight[];
  shops: OSMShop[];
  barges: OSMBarge[];
  locks: OSMLock[];
  wasteBins: OSMWasteBin[];
  trees: OSMTree[];
}

// ─── Paris Data tree type ────────────────────────────────────────

export interface ParisTree {
  id: number;
  position: [number, number]; // [lat, lng]
  species: string;
  commonName: string;
  height: number;             // meters
  circumference: number;      // cm
  plantYear: number;
}

export interface ParisTreeCollection {
  trees: ParisTreeRaw[];
}

export interface ParisTreeRaw {
  id: number;
  lat: number;
  lng: number;
  species: string;
  commonName: string;
  height: number;
  circumference: number;
  plantYear: number;
}

// ─── Scene-ready types (after GPS → Three.js conversion) ─────────

export interface SceneBuilding {
  id: string;
  type: OSMBuilding['type'];
  polygon: [number, number][];  // [x, z][] in scene units
  height: number;               // scene units (= meters)
  color: string;
  name: string | null;
}

export interface SceneWater {
  id: string;
  points: [number, number][];   // [x, z][] centerline in scene units
  width: number;                // scene units
  name: string | null;
}

export interface ScenePark {
  id: string;
  polygon: [number, number][];  // [x, z][] in scene units
  name: string | null;
}

export interface SceneRoad {
  id: string;
  type: OSMRoad['type'];
  points: [number, number][];   // [x, z][] centerline in scene units
  width: number;                // scene units
  name: string | null;
}

export interface ScenePointObject {
  id: string;
  position: [number, number]; // [x, z] in scene units
}

export interface SceneBench extends ScenePointObject {
  orientation: number; // radians
}

export interface SceneLamp extends ScenePointObject {
  height: number;
}

export interface SceneFountain extends ScenePointObject {
  type: 'wallace' | 'standard';
}

export interface SceneVelib extends ScenePointObject {
  stationId: string;
  name: string;
  capacity: number;
}

export interface SceneBusStop extends ScenePointObject {
  name: string;
  lines: string[];
}

export interface SceneTrafficLight extends ScenePointObject {}

export interface SceneShop extends ScenePointObject {
  name: string;
  type: OSMShop['type'];
}

export interface SceneBarge extends ScenePointObject {
  length: number;
  name: string | null;
  isTourBoat: boolean;
}

export interface SceneLock extends ScenePointObject {
  name: string | null;
}

export interface SceneWasteBin extends ScenePointObject {}

export interface SceneTree extends ScenePointObject {
  height: number;
  species: string;
  commonName: string;
}

export interface SceneObjects {
  buildings: SceneBuilding[];
  water: SceneWater[];
  parks: ScenePark[];
  roads: SceneRoad[];
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

// ─── Streaming / Tiling types ────────────────────────────────────

export interface TileCoord {
  row: number;
  col: number;
}

export interface TileEntry {
  row: number;
  col: number;
  features: number;
  file: string;
}

export interface TileManifest {
  tileSize: number;
  origin: { lat: number; lng: number };
  totalFeatures: number;
  tiles: Record<string, TileEntry>;
}

export type TileStatus = 'idle' | 'loading' | 'loaded' | 'error';
