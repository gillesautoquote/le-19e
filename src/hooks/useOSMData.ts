import { useState, useEffect, useRef } from 'react';
import { parseOSMGeoJSON } from '@/utils/osmParser';
import { convertToSceneObjects, convertParisTrees, parisTreestoSceneTrees } from '@/utils/osmToScene';
import type {
  GeoJSONCollection,
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
} from '@/types/osm';

// ─── Hook return type ────────────────────────────────────────────

interface UseOSMDataResult {
  buildings: SceneBuilding[];
  waterways: SceneWater[];
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
  isLoading: boolean;
  error: string | null;
}

// ─── Cache to prevent redundant fetches ──────────────────────────

interface CachedResult {
  sceneObjects: SceneObjects;
  parisTrees: SceneTree[];
}

const cache = new Map<string, CachedResult>();

// ─── Hook ────────────────────────────────────────────────────────

/**
 * Load and parse GeoJSON + Paris tree data.
 * Returns scene-ready typed objects for all feature types.
 * Results are cached — reloading the same path is a no-op.
 *
 * @param geojsonPath  Path to the main OSM GeoJSON file
 * @param treesPath    Optional path to Paris Data trees JSON
 */
export function useOSMData(
  geojsonPath: string,
  treesPath?: string,
): UseOSMDataResult {
  const cacheKey = `${geojsonPath}|${treesPath ?? ''}`;
  const [result, setResult] = useState<CachedResult | null>(
    () => cache.get(cacheKey) ?? null
  );
  const [isLoading, setIsLoading] = useState(!cache.has(cacheKey));
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (cache.has(cacheKey)) {
      setResult(cache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    const fetchGeojson = fetch(geojsonPath, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load GeoJSON: ${res.status}`);
        return res.json() as Promise<GeoJSONCollection>;
      });

    const fetchTrees = treesPath
      ? fetch(treesPath, { signal: controller.signal })
          .then((res) => {
            if (!res.ok) throw new Error(`Failed to load trees: ${res.status}`);
            return res.json() as Promise<ParisTreeCollection>;
          })
      : Promise.resolve(null);

    Promise.all([fetchGeojson, fetchTrees])
      .then(([geojson, treesRaw]) => {
        const osmData = parseOSMGeoJSON(geojson);
        const sceneObjects = convertToSceneObjects(osmData, geojson);

        let parisTrees: SceneTree[] = [];
        if (treesRaw) {
          const parsed = convertParisTrees(treesRaw);
          parisTrees = parisTreestoSceneTrees(parsed);
        }

        const cached: CachedResult = { sceneObjects, parisTrees };
        cache.set(cacheKey, cached);
        setResult(cached);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [cacheKey, geojsonPath, treesPath]);

  // Merge OSM trees with Paris Data trees, deduplicating by proximity
  const allTrees = result
    ? [...result.sceneObjects.trees, ...result.parisTrees]
    : [];

  return {
    buildings: result?.sceneObjects.buildings ?? [],
    waterways: result?.sceneObjects.water ?? [],
    parks: result?.sceneObjects.parks ?? [],
    roads: result?.sceneObjects.roads ?? [],
    benches: result?.sceneObjects.benches ?? [],
    lamps: result?.sceneObjects.lamps ?? [],
    fountains: result?.sceneObjects.fountains ?? [],
    velibs: result?.sceneObjects.velibs ?? [],
    busStops: result?.sceneObjects.busStops ?? [],
    trafficLights: result?.sceneObjects.trafficLights ?? [],
    shops: result?.sceneObjects.shops ?? [],
    barges: result?.sceneObjects.barges ?? [],
    locks: result?.sceneObjects.locks ?? [],
    wasteBins: result?.sceneObjects.wasteBins ?? [],
    trees: allTrees,
    isLoading,
    error,
  };
}
