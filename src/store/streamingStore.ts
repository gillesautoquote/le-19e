import { create } from 'zustand';
import { getTilesInRadius, diffTiles, tileUrl } from '@/systems/streamingSystem';
import { tileToSceneObjects, mergeSceneObjects, EMPTY_SCENE } from '@/utils/tileConverter';
import { loadHeightmap } from '@/systems/terrainSystem';
import type {
  GeoJSONCollection,
  TileManifest,
  TileStatus,
  SceneObjects,
} from '@/types/osm';

// ─── Constants ──────────────────────────────────────────────────

const STREAM_RADIUS = 300;
const TILES_BASE_PATH = '/data/tiles';
const MANIFEST_PATH = '/data/tiles/index.json';
const UPDATE_THRESHOLD = 30; // meters — don't re-evaluate tiles until player moved this far

// ─── Store interface ────────────────────────────────────────────

interface StreamingStore {
  // State
  manifest: TileManifest | null;
  tileStatus: Map<string, TileStatus>;
  tileData: Map<string, SceneObjects>;
  merged: SceneObjects;
  lastUpdatePos: [number, number] | null;
  isReady: boolean;
  error: string | null;

  // Actions
  loadManifest: () => Promise<void>;
  updatePlayerPosition: (x: number, z: number) => void;
}

// ─── Store ──────────────────────────────────────────────────────

export const useStreamingStore = create<StreamingStore>((set, get) => ({
  manifest: null,
  tileStatus: new Map(),
  tileData: new Map(),
  merged: EMPTY_SCENE,
  lastUpdatePos: null,
  isReady: false,
  error: null,

  loadManifest: async () => {
    try {
      // Load terrain heightmap first (objects need it for Y placement)
      await loadHeightmap();

      const res = await fetch(MANIFEST_PATH);
      if (!res.ok) throw new Error(`Failed to load tile manifest: ${res.status}`);
      const manifest = (await res.json()) as TileManifest;
      set({ manifest, isReady: true });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  updatePlayerPosition: (x: number, z: number) => {
    const { manifest, lastUpdatePos, tileStatus, tileData } = get();
    if (!manifest) return;

    // Throttle: only re-evaluate if player moved enough
    if (lastUpdatePos) {
      const dx = x - lastUpdatePos[0];
      const dz = z - lastUpdatePos[1];
      if (dx * dx + dz * dz < UPDATE_THRESHOLD * UPDATE_THRESHOLD) return;
    }

    const desiredKeys = getTilesInRadius(x, z, STREAM_RADIUS, manifest.tileSize, manifest);
    const currentKeys = new Set(tileData.keys());
    const { toLoad, toUnload } = diffTiles(currentKeys, desiredKeys);

    // Nothing to do
    if (toLoad.length === 0 && toUnload.length === 0) {
      set({ lastUpdatePos: [x, z] });
      return;
    }

    // Unload tiles immediately
    if (toUnload.length > 0) {
      const newTileData = new Map(tileData);
      const newTileStatus = new Map(tileStatus);
      for (const key of toUnload) {
        newTileData.delete(key);
        newTileStatus.delete(key);
      }
      const merged = mergeSceneObjects(newTileData);
      set({
        tileData: newTileData,
        tileStatus: newTileStatus,
        merged,
        lastUpdatePos: [x, z],
      });
    } else {
      set({ lastUpdatePos: [x, z] });
    }

    // Load new tiles in parallel
    for (const key of toLoad) {
      const entry = manifest.tiles[key];
      if (!entry) continue;

      // Skip if already loading
      if (get().tileStatus.get(key) === 'loading') continue;

      // Mark loading
      const statusMap = new Map(get().tileStatus);
      statusMap.set(key, 'loading');
      set({ tileStatus: statusMap });

      const url = tileUrl(TILES_BASE_PATH, entry);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Tile ${key}: ${res.status}`);
          return res.json() as Promise<GeoJSONCollection>;
        })
        .then((geojson) => {
          const sceneObjects = tileToSceneObjects(geojson);

          const currentData = new Map(get().tileData);
          const currentStatus = new Map(get().tileStatus);

          // Only add if tile is still wanted (player may have moved away)
          const latestDesired = getTilesInRadius(
            get().lastUpdatePos?.[0] ?? x,
            get().lastUpdatePos?.[1] ?? z,
            STREAM_RADIUS,
            manifest.tileSize,
            manifest,
          );

          if (latestDesired.includes(key)) {
            currentData.set(key, sceneObjects);
            currentStatus.set(key, 'loaded');
            const merged = mergeSceneObjects(currentData);
            set({ tileData: currentData, tileStatus: currentStatus, merged });
          } else {
            // Tile no longer needed, discard
            currentStatus.delete(key);
            set({ tileStatus: currentStatus });
          }
        })
        .catch(() => {
          const currentStatus = new Map(get().tileStatus);
          currentStatus.set(key, 'error');
          set({ tileStatus: currentStatus });
        });
    }
  },
}));
