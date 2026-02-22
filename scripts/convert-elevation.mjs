/**
 * convert-elevation.mjs
 *
 * Reads IGN RGE ALTI ASC tiles (Lambert 93, 5 m resolution),
 * extracts the area covering the 19th arrondissement,
 * and outputs a heightmap suitable for the game runtime.
 *
 * Usage:
 *   node scripts/convert-elevation.mjs <path-to-asc-folder>
 *
 * Output:
 *   public/data/heightmap.bin   — Float32Array, row-major (north → south)
 *   public/data/heightmap.json  — metadata (cols, rows, cellSize, origin, etc.)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import proj4 from 'proj4';

// ─── Projection definitions ─────────────────────────────────────

const LAMBERT93 =
  '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 ' +
  '+x_0=700000 +y_0=6600000 +ellps=GRS80 ' +
  '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const WGS84 = 'EPSG:4326';

// ─── Game reference point ────────────────────────────────────────

const REF_LAT = 48.8837;
const REF_LNG = 2.3699;

// Convert reference GPS → Lambert 93
const [refLamX, refLamY] = proj4(WGS84, LAMBERT93, [REF_LNG, REF_LAT]);
console.log(`Reference point Lambert 93: X=${refLamX.toFixed(2)}, Y=${refLamY.toFixed(2)}`);

// Reference altitude: canal de l'Ourcq water surface in IGN69
const REFERENCE_ALTITUDE = 52.0;

// ─── Output grid parameters ─────────────────────────────────────

const OUTPUT_CELL_SIZE = 10; // meters

// Scene-space bounds (with margin beyond playable area)
const SCENE_X_MIN = -2000;
const SCENE_X_MAX = 5500;
const SCENE_Z_MIN = -4700;
const SCENE_Z_MAX = 4000;

const OUTPUT_COLS = Math.ceil((SCENE_X_MAX - SCENE_X_MIN) / OUTPUT_CELL_SIZE) + 1;
const OUTPUT_ROWS = Math.ceil((SCENE_Z_MAX - SCENE_Z_MIN) / OUTPUT_CELL_SIZE) + 1;

console.log(`Output grid: ${OUTPUT_COLS} cols × ${OUTPUT_ROWS} rows = ${OUTPUT_COLS * OUTPUT_ROWS} cells`);

// ─── ASC tile reader ─────────────────────────────────────────────

/**
 * @typedef {{ ncols: number, nrows: number, xll: number, yll: number, cellSize: number, nodata: number, data: Float32Array }} AscTile
 */

/** Parse an ESRI ASCII Grid file. */
function readAscTile(filePath) {
  console.log(`  Reading ${filePath}...`);
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Parse header (6 lines)
  const ncols = parseInt(lines[0].split(/\s+/).pop());
  const nrows = parseInt(lines[1].split(/\s+/).pop());
  const xll = parseFloat(lines[2].split(/\s+/).pop());
  const yll = parseFloat(lines[3].split(/\s+/).pop());
  const cellSize = parseFloat(lines[4].split(/\s+/).pop());
  const nodata = parseFloat(lines[5].split(/\s+/).pop());

  // Parse data rows (row 0 = north edge, row nrows-1 = south edge)
  const data = new Float32Array(ncols * nrows);
  for (let r = 0; r < nrows; r++) {
    const lineIdx = 6 + r;
    if (lineIdx >= lines.length) break;
    const values = lines[lineIdx].trim().split(/\s+/);
    for (let c = 0; c < ncols && c < values.length; c++) {
      data[r * ncols + c] = parseFloat(values[c]);
    }
  }

  return { ncols, nrows, xll, yll, cellSize, nodata, data };
}

/**
 * Sample elevation from an ASC tile at a Lambert 93 position.
 * Returns null if position is outside the tile or is NODATA.
 */
function sampleTile(tile, lamX, lamY) {
  // ASC grid: xll/yll is SW corner, row 0 is north edge
  // So the north edge Y = yll + nrows * cellSize
  const northY = tile.yll + tile.nrows * tile.cellSize;

  const col = (lamX - tile.xll) / tile.cellSize;
  const row = (northY - lamY) / tile.cellSize;

  if (col < 0 || col >= tile.ncols - 1 || row < 0 || row >= tile.nrows - 1) {
    return null;
  }

  // Bilinear interpolation
  const c0 = Math.floor(col);
  const r0 = Math.floor(row);
  const c1 = c0 + 1;
  const r1 = r0 + 1;
  const tx = col - c0;
  const ty = row - r0;

  const v00 = tile.data[r0 * tile.ncols + c0];
  const v10 = tile.data[r0 * tile.ncols + c1];
  const v01 = tile.data[r1 * tile.ncols + c0];
  const v11 = tile.data[r1 * tile.ncols + c1];

  // Check for NODATA
  if (v00 <= tile.nodata + 1 || v10 <= tile.nodata + 1 ||
      v01 <= tile.nodata + 1 || v11 <= tile.nodata + 1) {
    // Use nearest valid value
    const candidates = [v00, v10, v01, v11].filter(v => v > tile.nodata + 1);
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) => a + b, 0) / candidates.length;
  }

  const top = v00 * (1 - tx) + v10 * tx;
  const bot = v01 * (1 - tx) + v11 * tx;
  return top * (1 - ty) + bot * ty;
}

// ─── Main ────────────────────────────────────────────────────────

const ascFolder = process.argv[2];
if (!ascFolder) {
  console.error('Usage: node scripts/convert-elevation.mjs <path-to-asc-folder>');
  process.exit(1);
}

const tileFiles = [
  'RGEALTI_FXX_0650_6865_MNT_LAMB93_IGN69.asc',
  'RGEALTI_FXX_0655_6865_MNT_LAMB93_IGN69.asc',
  'RGEALTI_FXX_0650_6870_MNT_LAMB93_IGN69.asc',
  'RGEALTI_FXX_0655_6870_MNT_LAMB93_IGN69.asc',
];

console.log('Loading ASC tiles...');
const tiles = tileFiles.map(f => readAscTile(join(resolve(ascFolder), f)));

// Build output heightmap
console.log('Building heightmap...');
const output = new Float32Array(OUTPUT_COLS * OUTPUT_ROWS);
let minElev = Infinity;
let maxElev = -Infinity;
let filledCount = 0;

for (let row = 0; row < OUTPUT_ROWS; row++) {
  const sceneZ = SCENE_Z_MIN + row * OUTPUT_CELL_SIZE;

  for (let col = 0; col < OUTPUT_COLS; col++) {
    const sceneX = SCENE_X_MIN + col * OUTPUT_CELL_SIZE;

    // Scene → Lambert 93
    const lamX = refLamX + sceneX;
    const lamY = refLamY - sceneZ; // Z is inverted in scene

    // Try each tile until we get a value
    let elevation = null;
    for (const tile of tiles) {
      elevation = sampleTile(tile, lamX, lamY);
      if (elevation !== null) break;
    }

    if (elevation !== null) {
      const relativeHeight = elevation - REFERENCE_ALTITUDE;
      output[row * OUTPUT_COLS + col] = relativeHeight;
      if (relativeHeight < minElev) minElev = relativeHeight;
      if (relativeHeight > maxElev) maxElev = relativeHeight;
      filledCount++;
    } else {
      // Outside coverage: set to 0 (canal level)
      output[row * OUTPUT_COLS + col] = 0;
    }
  }

  if (row % 100 === 0) {
    process.stdout.write(`  Row ${row}/${OUTPUT_ROWS}\r`);
  }
}

console.log(`\nDone! Filled ${filledCount}/${OUTPUT_COLS * OUTPUT_ROWS} cells (${(filledCount * 100 / (OUTPUT_COLS * OUTPUT_ROWS)).toFixed(1)}%)`);
console.log(`Elevation range: ${minElev.toFixed(1)}m to ${maxElev.toFixed(1)}m (relative to canal)`);

// Check a known point: Buttes Chaumont peak (~48.8808, 2.3826)
const [bcLamX, bcLamY] = proj4(WGS84, LAMBERT93, [2.3826, 48.8808]);
const bcSceneX = bcLamX - refLamX;
const bcSceneZ = -(bcLamY - refLamY);
const bcCol = Math.round((bcSceneX - SCENE_X_MIN) / OUTPUT_CELL_SIZE);
const bcRow = Math.round((bcSceneZ - SCENE_Z_MIN) / OUTPUT_CELL_SIZE);
if (bcCol >= 0 && bcCol < OUTPUT_COLS && bcRow >= 0 && bcRow < OUTPUT_ROWS) {
  const bcHeight = output[bcRow * OUTPUT_COLS + bcCol];
  console.log(`Buttes Chaumont check: scene(${bcSceneX.toFixed(0)}, ${bcSceneZ.toFixed(0)}) → height ${bcHeight.toFixed(1)}m`);
}

// Check canal center (should be ~0)
const canalCol = Math.round((0 - SCENE_X_MIN) / OUTPUT_CELL_SIZE);
const canalRow = Math.round((0 - SCENE_Z_MIN) / OUTPUT_CELL_SIZE);
if (canalCol >= 0 && canalCol < OUTPUT_COLS && canalRow >= 0 && canalRow < OUTPUT_ROWS) {
  const canalHeight = output[canalRow * OUTPUT_COLS + canalCol];
  console.log(`Canal center check: scene(0, 0) → height ${canalHeight.toFixed(1)}m`);
}

// ─── Write output ────────────────────────────────────────────────

const outDir = join(resolve('.'), 'public', 'data');
mkdirSync(outDir, { recursive: true });

// Binary heightmap
const binPath = join(outDir, 'heightmap.bin');
writeFileSync(binPath, Buffer.from(output.buffer));
console.log(`Written ${binPath} (${(output.byteLength / 1024 / 1024).toFixed(1)} MB)`);

// JSON metadata
const meta = {
  cols: OUTPUT_COLS,
  rows: OUTPUT_ROWS,
  cellSize: OUTPUT_CELL_SIZE,
  originX: SCENE_X_MIN,
  originZ: SCENE_Z_MIN,
  refAltitude: REFERENCE_ALTITUDE,
  minElevation: Math.round(minElev * 10) / 10,
  maxElevation: Math.round(maxElev * 10) / 10,
};

const jsonPath = join(outDir, 'heightmap.json');
writeFileSync(jsonPath, JSON.stringify(meta, null, 2));
console.log(`Written ${jsonPath}`);
console.log('\nHeightmap generation complete!');
