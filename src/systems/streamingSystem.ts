import type { TileCoord, TileManifest, TileEntry } from '@/types/osm';

// ─── Tile coordinate math ───────────────────────────────────────

const METERS_PER_DEG_LAT = 111_320;

/**
 * Convert a scene-space position [x, z] to a tile coordinate [row, col].
 * The tiling grid is aligned with GPS at the reference origin,
 * projected to meters the same way geoUtils does it.
 */
export function sceneToTile(
  x: number,
  z: number,
  tileSize: number,
): TileCoord {
  // Must match tile-geojson.mjs sceneToTile():
  //   row = floor(z / tileSize), col = floor(x / tileSize)
  const row = Math.floor(z / tileSize);
  const col = Math.floor(x / tileSize);
  return { row, col };
}

/**
 * Get all tile coordinates within a given radius (in meters) of a scene position.
 * Returns a set of "row_col" keys for fast lookup.
 */
export function getTilesInRadius(
  x: number,
  z: number,
  radius: number,
  tileSize: number,
  manifest: TileManifest,
): string[] {
  const center = sceneToTile(x, z, tileSize);

  // How many tiles the radius spans
  const tileRadius = Math.ceil(radius / tileSize);

  const keys: string[] = [];
  for (let dr = -tileRadius; dr <= tileRadius; dr++) {
    for (let dc = -tileRadius; dc <= tileRadius; dc++) {
      // Check that tile center is within radius (approximate but good enough)
      const tileCenterX = (center.col + dc + 0.5) * tileSize;
      const tileCenterZ = (center.row + dr + 0.5) * tileSize;
      const dx = tileCenterX - x;
      const dz = tileCenterZ - z;
      if (dx * dx + dz * dz <= (radius + tileSize * 0.7) * (radius + tileSize * 0.7)) {
        const key = `${center.row + dr}_${center.col + dc}`;
        if (manifest.tiles[key]) {
          keys.push(key);
        }
      }
    }
  }

  return keys;
}

/**
 * Compute which tiles need loading and which need unloading.
 */
export function diffTiles(
  currentKeys: Set<string>,
  desiredKeys: string[],
): { toLoad: string[]; toUnload: string[] } {
  const desiredSet = new Set(desiredKeys);

  const toLoad: string[] = [];
  for (const key of desiredKeys) {
    if (!currentKeys.has(key)) {
      toLoad.push(key);
    }
  }

  const toUnload: string[] = [];
  for (const key of currentKeys) {
    if (!desiredSet.has(key)) {
      toUnload.push(key);
    }
  }

  return { toLoad, toUnload };
}

/**
 * Build the fetch URL for a tile given the manifest entry and base path.
 */
export function tileUrl(basePath: string, entry: TileEntry): string {
  return `${basePath}/${entry.file}`;
}
