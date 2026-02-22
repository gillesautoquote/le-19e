import { EPOCH_A, BUILDING_COLORS_KEYS } from '@/constants/epochs';
import type { GeoJSONFeature } from '@/types/osm';

// ─── Reference point: center of Canal de l'Ourcq (MVP origin) ────

const REF_LAT = 48.8837;
const REF_LNG = 2.3699;

// Meters per degree at reference latitude
const METERS_PER_DEG_LAT = 111_320;
const METERS_PER_DEG_LNG = 111_320 * Math.cos((REF_LAT * Math.PI) / 180);

// ─── GPS ↔ Scene conversion ──────────────────────────────────────

/**
 * Convert GPS coordinates to Three.js scene position.
 * 1 scene unit = 1 meter.
 * X axis = east/west (lng), Z axis = south/north (lat inverted for Three.js).
 */
export function gpsToScene(lat: number, lng: number): [number, number, number] {
  const x = (lng - REF_LNG) * METERS_PER_DEG_LNG;
  const z = -(lat - REF_LAT) * METERS_PER_DEG_LAT;
  return [x, 0, z];
}

/**
 * Convert scene position back to GPS coordinates.
 */
export function sceneToGps(x: number, z: number): [number, number] {
  const lng = x / METERS_PER_DEG_LNG + REF_LNG;
  const lat = -(z / METERS_PER_DEG_LAT) + REF_LAT;
  return [lat, lng];
}

// ─── Building attribute extraction ───────────────────────────────

const DEFAULT_BUILDING_HEIGHT = 10;
const METERS_PER_LEVEL = 3.5;

/**
 * Extract building height from OSM tags.
 * Priority: height tag > building:levels * 3.5m > default 10m.
 */
export function getBuildingHeight(feature: GeoJSONFeature): number {
  const props = feature.properties;

  if (props.height) {
    const parsed = parseFloat(props.height);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  if (props['building:levels']) {
    const levels = parseInt(props['building:levels'], 10);
    if (!isNaN(levels) && levels > 0) {
      return levels * METERS_PER_LEVEL;
    }
  }

  return DEFAULT_BUILDING_HEIGHT;
}

/**
 * Deterministic hash from a string — spreads values evenly.
 */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Residential tones — warm beige/cream palette */
const RESIDENTIAL_COLORS = [
  EPOCH_A.building_residential,  // #E8D5B7
  EPOCH_A.building_cream,        // #E0C8A8
  EPOCH_A.building_sandstone,    // #D4A574
] as const;

/** Commercial tones — terracotta/tan palette */
const COMMERCIAL_COLORS = [
  EPOCH_A.building_commercial,   // #C4A882
  EPOCH_A.building_terracotta,   // #C4785A
] as const;

/**
 * Fallback color when feature is not found in featureMap.
 * Uses the building id to deterministically pick from the full palette.
 */
export function hashBuildingColor(id: string): string {
  const h = hashString(id);
  const key = BUILDING_COLORS_KEYS[h % BUILDING_COLORS_KEYS.length];
  return EPOCH_A[key];
}

/**
 * Return a building color from EPOCH_A palette based on OSM building type.
 * Uses a hash on the feature id for deterministic variety within each type.
 */
export function getBuildingColor(feature: GeoJSONFeature): string {
  const buildingType = feature.properties.building;
  const id = feature.properties.id ?? feature.properties['@id'] ?? '';
  const h = hashString(id);

  switch (buildingType) {
    case 'commercial':
    case 'retail':
    case 'office':
      return COMMERCIAL_COLORS[h % COMMERCIAL_COLORS.length];
    case 'industrial':
    case 'warehouse':
      return EPOCH_A.building_sandstone;
    case 'apartments':
    case 'residential':
    case 'house':
      return RESIDENTIAL_COLORS[h % RESIDENTIAL_COLORS.length];
    default: {
      // Unknown type — pick from all building colors
      const key = BUILDING_COLORS_KEYS[h % BUILDING_COLORS_KEYS.length];
      return EPOCH_A[key];
    }
  }
}
