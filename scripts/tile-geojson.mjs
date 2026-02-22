#!/usr/bin/env node
/**
 * tile-geojson.mjs
 *
 * Pre-processes a large OSM GeoJSON export into spatial tiles for streaming.
 *
 * Usage:
 *   node scripts/tile-geojson.mjs [input.geojson] [output-dir] [tile-size-meters]
 *
 * Defaults:
 *   input:    ../export.geojson
 *   output:   public/data/tiles/
 *   tileSize: 100 (meters)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ─── Configuration ───────────────────────────────────────────────

const INPUT_PATH = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(PROJECT_ROOT, '..', 'export.geojson');
const OUTPUT_DIR = process.argv[3]
  ? resolve(process.argv[3])
  : resolve(PROJECT_ROOT, 'public', 'data', 'tiles');
const TILE_SIZE = parseInt(process.argv[4] ?? '100', 10);

// Reference point (scene origin) — must match geoUtils.ts REF_LAT/REF_LNG
const REF_LAT = 48.8837;
const REF_LNG = 2.3699;
const METERS_PER_DEG_LAT = 111_320;
const METERS_PER_DEG_LNG = 111_320 * Math.cos((REF_LAT * Math.PI) / 180);

// ─── GPS → Scene conversion (mirrors geoUtils.ts gpsToScene) ────

function gpsToScene(lat, lng) {
  const x = (lng - REF_LNG) * METERS_PER_DEG_LNG;
  const z = -(lat - REF_LAT) * METERS_PER_DEG_LAT;
  return [x, z];
}

function sceneToTile(x, z) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(z / TILE_SIZE);
  return `${row}_${col}`;
}

// ─── Compute feature centroid ────────────────────────────────────

function getFeatureCentroid(feature) {
  const geom = feature.geometry;
  const type = geom.type;
  const coords = geom.coordinates;

  if (type === 'Point') {
    return gpsToScene(coords[1], coords[0]);
  }

  if (type === 'LineString') {
    const mid = Math.floor(coords.length / 2);
    return gpsToScene(coords[mid][1], coords[mid][0]);
  }

  if (type === 'Polygon') {
    const ring = coords[0];
    let sumLat = 0;
    let sumLng = 0;
    for (const [lng, lat] of ring) {
      sumLat += lat;
      sumLng += lng;
    }
    return gpsToScene(sumLat / ring.length, sumLng / ring.length);
  }

  if (type === 'MultiPolygon') {
    // Use first polygon centroid
    const ring = coords[0][0];
    let sumLat = 0;
    let sumLng = 0;
    for (const [lng, lat] of ring) {
      sumLat += lat;
      sumLng += lng;
    }
    return gpsToScene(sumLat / ring.length, sumLng / ring.length);
  }

  return [0, 0];
}

// ─── Normalize feature properties ────────────────────────────────

function normalizeProperties(props) {
  const normalized = { ...props };

  // Map @id → id (Overpass Turbo uses @id, our parser expects id)
  if (normalized['@id'] && !normalized.id) {
    normalized.id = normalized['@id'];
  }

  return normalized;
}

// ─── Main ────────────────────────────────────────────────────────

console.log(`Reading ${INPUT_PATH}...`);
const raw = readFileSync(INPUT_PATH, 'utf-8');
const geojson = JSON.parse(raw);
const features = geojson.features;
console.log(`  ${features.length} features loaded`);

// ─── Get all tiles a LineString passes through ──────────────────

function getLineStringTiles(coords) {
  const tileKeys = new Set();
  for (const [lng, lat] of coords) {
    const [x, z] = gpsToScene(lat, lng);
    tileKeys.add(sceneToTile(x, z));
  }
  return [...tileKeys];
}

// Assign each feature to a tile (or multiple tiles for LineStrings)
const tiles = new Map(); // tileKey → features[]
let skipped = 0;
let duplicated = 0;

for (const feature of features) {
  // Normalize properties
  feature.properties = normalizeProperties(feature.properties);

  const geom = feature.geometry;

  // LineStrings (waterways, roads, etc.) can span many tiles —
  // assign to ALL tiles they pass through, not just the midpoint.
  if (geom.type === 'LineString') {
    const tileKeys = getLineStringTiles(geom.coordinates);
    for (const tileKey of tileKeys) {
      if (!tiles.has(tileKey)) {
        tiles.set(tileKey, []);
      }
      tiles.get(tileKey).push(feature);
    }
    if (tileKeys.length > 1) {
      duplicated += tileKeys.length - 1;
    }
  } else {
    // Points, Polygons, MultiPolygons — single tile by centroid
    const [cx, cz] = getFeatureCentroid(feature);
    const tileKey = sceneToTile(cx, cz);

    if (!tiles.has(tileKey)) {
      tiles.set(tileKey, []);
    }
    tiles.get(tileKey).push(feature);
  }
}

console.log(`  ${tiles.size} tiles generated (${TILE_SIZE}m grid)`);
console.log(`  ${skipped} features skipped`);
console.log(`  ${duplicated} feature duplications (LineStrings spanning multiple tiles)`);

// Stats
const counts = [...tiles.values()].map((f) => f.length);
const minFeatures = Math.min(...counts);
const maxFeatures = Math.max(...counts);
const avgFeatures = (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1);
console.log(`  Features per tile: min=${minFeatures}, max=${maxFeatures}, avg=${avgFeatures}`);

// Create output directory
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Write tile files
const manifest = {
  tileSize: TILE_SIZE,
  origin: { lat: REF_LAT, lng: REF_LNG },
  totalFeatures: features.length - skipped,
  tiles: {},
};

for (const [tileKey, tileFeatures] of tiles) {
  const tileFile = `${tileKey}.json`;
  const tileGeoJSON = {
    type: 'FeatureCollection',
    features: tileFeatures,
  };

  writeFileSync(
    resolve(OUTPUT_DIR, tileFile),
    JSON.stringify(tileGeoJSON),
    'utf-8'
  );

  const [row, col] = tileKey.split('_').map(Number);
  manifest.tiles[tileKey] = {
    row,
    col,
    features: tileFeatures.length,
    file: tileFile,
  };
}

// Write manifest
writeFileSync(
  resolve(OUTPUT_DIR, 'index.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
);

console.log(`\nOutput written to ${OUTPUT_DIR}/`);
console.log(`  ${tiles.size} tile files + index.json`);
console.log('Done.');
