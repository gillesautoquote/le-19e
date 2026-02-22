import type { GeoJSONFeature } from '@/types/osm';

// ─── ID resolution (handles both simulated and real OSM data) ────

export function resolveId(feature: GeoJSONFeature, fallbackPrefix: string): string {
  return feature.properties.id
    ?? feature.properties['@id']
    ?? `${fallbackPrefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveFeatureId(feature: GeoJSONFeature): string {
  return feature.properties.id ?? feature.properties['@id'] ?? '';
}

// ─── Road width defaults by highway type (meters) ────────────────

export const ROAD_WIDTH: Record<string, number> = {
  primary: 14,
  secondary: 10,
  tertiary: 8,
  residential: 6,
  footway: 2,
  cycleway: 3,
  path: 2,
};

// Real-world widths by waterway name (meters)
export const WATERWAY_WIDTH_BY_NAME: Record<string, number> = {
  'Canal Saint-Martin': 25,
  'Canal de l\'Ourcq': 12,
  'Bassin de la Villette': 30,
  'Second Bassin de la Villette': 30,
};
export const CANAL_DEFAULT_WIDTH = 25;

// ─── Coordinate extractors ───────────────────────────────────────

export function extractPolygonCoords(feature: GeoJSONFeature): [number, number][] {
  if (feature.geometry.type === 'Polygon') {
    const ring = (feature.geometry.coordinates as number[][][])[0];
    if (!ring) return [];
    return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
  }
  if (feature.geometry.type === 'MultiPolygon') {
    const ring = (feature.geometry.coordinates as number[][][][])[0]?.[0];
    if (!ring) return [];
    return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
  }
  return [];
}

export function extractLineCoords(feature: GeoJSONFeature): [number, number][] {
  if (feature.geometry.type !== 'LineString') return [];
  const coords = feature.geometry.coordinates as number[][];
  return coords.map(([lng, lat]) => [lat, lng] as [number, number]);
}

export function extractPointCoords(feature: GeoJSONFeature): [number, number] | null {
  if (feature.geometry.type !== 'Point') return null;
  const [lng, lat] = feature.geometry.coordinates as number[];
  return [lat, lng];
}

// ─── Feature type detection ──────────────────────────────────────

export function isBuilding(feature: GeoJSONFeature): boolean {
  return (
    feature.properties.building !== undefined &&
    (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
  );
}

export function isWaterway(feature: GeoJSONFeature): boolean {
  return (
    feature.properties.waterway !== undefined &&
    feature.geometry.type === 'LineString'
  );
}

export function isLock(feature: GeoJSONFeature): boolean {
  return (
    feature.properties.waterway === 'lock' &&
    feature.geometry.type === 'Point'
  );
}

export function isPark(feature: GeoJSONFeature): boolean {
  return (
    (feature.properties.leisure === 'park' || feature.properties.leisure === 'garden') &&
    (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
  );
}

export function isRoad(feature: GeoJSONFeature): boolean {
  const hw = feature.properties.highway;
  return (
    hw !== undefined &&
    feature.geometry.type === 'LineString' &&
    hw !== 'street_lamp' &&
    hw !== 'bus_stop' &&
    hw !== 'traffic_signals' &&
    hw !== 'crossing'
  );
}

export function isBench(feature: GeoJSONFeature): boolean {
  return feature.properties.amenity === 'bench' && feature.geometry.type === 'Point';
}

export function isLamp(feature: GeoJSONFeature): boolean {
  return feature.properties.highway === 'street_lamp' && feature.geometry.type === 'Point';
}

export function isFountain(feature: GeoJSONFeature): boolean {
  return feature.properties.amenity === 'drinking_water' && feature.geometry.type === 'Point';
}

export function isVelib(feature: GeoJSONFeature): boolean {
  return feature.properties.amenity === 'bicycle_rental' && feature.geometry.type === 'Point';
}

export function isBusStop(feature: GeoJSONFeature): boolean {
  return feature.properties.highway === 'bus_stop' && feature.geometry.type === 'Point';
}

export function isTrafficLight(feature: GeoJSONFeature): boolean {
  return feature.properties.highway === 'traffic_signals' && feature.geometry.type === 'Point';
}

export function isShop(feature: GeoJSONFeature): boolean {
  return (
    feature.geometry.type === 'Point' &&
    (feature.properties.shop !== undefined ||
      feature.properties.amenity === 'cafe' ||
      feature.properties.amenity === 'restaurant' ||
      feature.properties.amenity === 'bar' ||
      feature.properties.amenity === 'pharmacy')
  );
}

export function isBarge(feature: GeoJSONFeature): boolean {
  return feature.properties.waterway === 'boat' && feature.geometry.type === 'Point';
}

export function isWasteBin(feature: GeoJSONFeature): boolean {
  return feature.properties.amenity === 'waste_basket' && feature.geometry.type === 'Point';
}

export function isTree(feature: GeoJSONFeature): boolean {
  return feature.properties.natural === 'tree' && feature.geometry.type === 'Point';
}
