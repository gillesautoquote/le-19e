import {
  resolveId,
  ROAD_WIDTH,
  WATERWAY_WIDTH_BY_NAME,
  CANAL_DEFAULT_WIDTH,
  extractPolygonCoords,
  extractLineCoords,
  extractPointCoords,
} from '@/utils/osmDetectors';
import type {
  GeoJSONFeature,
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
} from '@/types/osm';

// ─── Polygon-based parsers ──────────────────────────────────────

export function parseBuilding(feature: GeoJSONFeature): OSMBuilding | null {
  const coords = extractPolygonCoords(feature);
  if (coords.length < 4) return null;

  const levelsStr = feature.properties['building:levels'];
  const heightStr = feature.properties.height;
  const levels = levelsStr ? parseInt(levelsStr, 10) : 0;
  const height = heightStr ? parseFloat(heightStr) : levels > 0 ? levels * 3.5 : 10;

  const rawType = feature.properties.building ?? 'yes';
  const validTypes = ['residential', 'commercial', 'apartments', 'industrial', 'yes'] as const;
  const type = validTypes.includes(rawType as typeof validTypes[number])
    ? (rawType as OSMBuilding['type'])
    : 'yes';

  return {
    id: resolveId(feature, 'bld'),
    type,
    coordinates: coords,
    height,
    levels: levels || Math.ceil(height / 3.5),
    name: feature.properties.name ?? null,
  };
}

export function parsePark(feature: GeoJSONFeature): OSMPark | null {
  const coords = extractPolygonCoords(feature);
  if (coords.length < 4) return null;

  return {
    id: resolveId(feature, 'park'),
    coordinates: coords,
    name: feature.properties.name ?? null,
  };
}

// ─── LineString-based parsers ───────────────────────────────────

export function parseWaterway(feature: GeoJSONFeature): OSMWaterway | null {
  const coords = extractLineCoords(feature);
  if (coords.length < 2) return null;

  const rawType = feature.properties.waterway ?? 'canal';
  const validTypes = ['canal', 'river', 'stream'] as const;
  const type = validTypes.includes(rawType as typeof validTypes[number])
    ? (rawType as OSMWaterway['type'])
    : 'canal';

  const widthStr = feature.properties.width;
  const name = feature.properties.name ?? '';
  const nameWidth = WATERWAY_WIDTH_BY_NAME[name];
  const width = widthStr ? parseFloat(widthStr) : (nameWidth ?? (type === 'canal' ? CANAL_DEFAULT_WIDTH : 10));

  return {
    id: resolveId(feature, 'ww'),
    type,
    coordinates: coords,
    width,
    name: feature.properties.name ?? null,
  };
}

export function parseRoad(feature: GeoJSONFeature): OSMRoad | null {
  const coords = extractLineCoords(feature);
  if (coords.length < 2) return null;

  const highway = feature.properties.highway ?? 'residential';
  const rawType = highway === 'path' ? 'footway' : highway;
  const validTypes = ['primary', 'secondary', 'tertiary', 'residential', 'footway', 'cycleway'] as const;
  const type = validTypes.includes(rawType as typeof validTypes[number])
    ? (rawType as OSMRoad['type'])
    : 'residential';

  return {
    id: resolveId(feature, 'road'),
    type,
    coordinates: coords,
    width: ROAD_WIDTH[rawType] ?? ROAD_WIDTH[type] ?? 6,
    name: feature.properties.name ?? null,
    oneway: feature.properties.oneway === 'yes',
  };
}

// ─── Point-based parsers ────────────────────────────────────────

export function parseBench(feature: GeoJSONFeature): OSMBench | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;
  const dirStr = feature.properties.direction;
  const orientation = dirStr ? parseFloat(dirStr) : 0;

  return {
    id: resolveId(feature, 'bench'),
    position: pos,
    orientation: isNaN(orientation) ? 0 : orientation,
  };
}

export function parseLamp(feature: GeoJSONFeature): OSMLamp | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  return {
    id: resolveId(feature, 'lamp'),
    position: pos,
    height: 5,
  };
}

export function parseFountain(feature: GeoJSONFeature): OSMFountain | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  return {
    id: resolveId(feature, 'fountain'),
    position: pos,
    type: feature.properties.fountain === 'wallace' ? 'wallace' : 'standard',
  };
}

export function parseVelib(feature: GeoJSONFeature): OSMVelib | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  const capacityStr = feature.properties.capacity;
  const capacity = capacityStr ? parseInt(capacityStr, 10) : 20;

  return {
    id: resolveId(feature, 'velib'),
    position: pos,
    stationId: feature.properties.ref ?? '',
    name: feature.properties.name ?? 'Station Vélib',
    capacity: isNaN(capacity) ? 20 : capacity,
  };
}

export function parseBusStop(feature: GeoJSONFeature): OSMBusStop | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  const routeRef = feature.properties.route_ref ?? '';
  const lines = routeRef
    .split(';')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return {
    id: resolveId(feature, 'bus'),
    position: pos,
    name: feature.properties.name ?? 'Arrêt',
    lines,
  };
}

export function parseTrafficLight(feature: GeoJSONFeature): OSMTrafficLight | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  return {
    id: resolveId(feature, 'tl'),
    position: pos,
  };
}

export function parseShop(feature: GeoJSONFeature): OSMShop | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  const shopTypes = ['bakery', 'pharmacy', 'convenience'] as const;
  const amenityMap: Record<string, OSMShop['type']> = {
    cafe: 'cafe',
    restaurant: 'restaurant',
    bar: 'bar',
    pharmacy: 'pharmacy',
    cinema: 'cinema',
  };

  let type: OSMShop['type'] = 'other';
  const shopProp = feature.properties.shop;
  const amenityProp = feature.properties.amenity;

  if (shopProp && shopTypes.includes(shopProp as typeof shopTypes[number])) {
    type = shopProp as OSMShop['type'];
  } else if (amenityProp && amenityMap[amenityProp]) {
    type = amenityMap[amenityProp];
  } else if (shopProp) {
    type = 'convenience';
  }

  return {
    id: resolveId(feature, 'shop'),
    position: pos,
    name: feature.properties.name ?? 'Commerce',
    type,
  };
}
