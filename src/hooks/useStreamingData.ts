import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStreamingStore } from '@/store/streamingStore';
import { usePlayerStore } from '@/store/playerStore';
import type {
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
} from '@/types/osm';

// ─── Hook return type (matches useOSMData) ──────────────────────

interface UseStreamingDataResult {
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

// ─── Position update interval (seconds) ─────────────────────────

const POSITION_CHECK_INTERVAL = 0.5;

// ─── Stable empty arrays ────────────────────────────────────────

const EMPTY_BUILDINGS: SceneBuilding[] = [];
const EMPTY_WATER: SceneWater[] = [];
const EMPTY_PARKS: ScenePark[] = [];
const EMPTY_ROADS: SceneRoad[] = [];
const EMPTY_BENCHES: SceneBench[] = [];
const EMPTY_LAMPS: SceneLamp[] = [];
const EMPTY_FOUNTAINS: SceneFountain[] = [];
const EMPTY_VELIBS: SceneVelib[] = [];
const EMPTY_BUS_STOPS: SceneBusStop[] = [];
const EMPTY_TRAFFIC_LIGHTS: SceneTrafficLight[] = [];
const EMPTY_SHOPS: SceneShop[] = [];
const EMPTY_BARGES: SceneBarge[] = [];
const EMPTY_LOCKS: SceneLock[] = [];
const EMPTY_WASTE_BINS: SceneWasteBin[] = [];
const EMPTY_TREES: SceneTree[] = [];

/**
 * Keep old reference if array length hasn't changed.
 * This prevents downstream useMemo/React.memo invalidation
 * when unrelated tile types update.
 */
function stableArray<T>(prev: T[], next: T[]): T[] {
  if (prev === next) return prev;
  if (prev.length === next.length && next.length === 0) return prev;
  if (prev.length === next.length) return prev;
  return next;
}

// ─── Hook ───────────────────────────────────────────────────────

/**
 * Drop-in replacement for useOSMData that streams tiles dynamically
 * based on the player's position. Components receive the same typed
 * arrays without knowing how data was loaded.
 *
 * Must be called inside a R3F <Canvas> (uses useFrame).
 */
export function useStreamingData(): UseStreamingDataResult {
  const loadManifest = useStreamingStore((s) => s.loadManifest);
  const updatePlayerPosition = useStreamingStore((s) => s.updatePlayerPosition);
  const merged = useStreamingStore((s) => s.merged);
  const isReady = useStreamingStore((s) => s.isReady);
  const error = useStreamingStore((s) => s.error);

  const timerRef = useRef(0);
  const initRef = useRef(false);
  const cacheRef = useRef<UseStreamingDataResult>({
    buildings: EMPTY_BUILDINGS,
    waterways: EMPTY_WATER,
    parks: EMPTY_PARKS,
    roads: EMPTY_ROADS,
    benches: EMPTY_BENCHES,
    lamps: EMPTY_LAMPS,
    fountains: EMPTY_FOUNTAINS,
    velibs: EMPTY_VELIBS,
    busStops: EMPTY_BUS_STOPS,
    trafficLights: EMPTY_TRAFFIC_LIGHTS,
    shops: EMPTY_SHOPS,
    barges: EMPTY_BARGES,
    locks: EMPTY_LOCKS,
    wasteBins: EMPTY_WASTE_BINS,
    trees: EMPTY_TREES,
    isLoading: true,
    error: null,
  });

  // Load manifest on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      loadManifest();
    }
  }, [loadManifest]);

  // Trigger initial tile load once manifest is ready
  useEffect(() => {
    if (isReady) {
      const [px, , pz] = usePlayerStore.getState().position;
      updatePlayerPosition(px, pz);
    }
  }, [isReady, updatePlayerPosition]);

  // Poll player position at a throttled rate via useFrame
  useFrame((_, delta) => {
    if (!isReady) return;

    timerRef.current += delta;
    if (timerRef.current < POSITION_CHECK_INTERVAL) return;
    timerRef.current = 0;

    const [px, , pz] = usePlayerStore.getState().position;
    updatePlayerPosition(px, pz);
  });

  // Stabilize array references — only replace when content changed
  const prev = cacheRef.current;
  const result: UseStreamingDataResult = {
    buildings: stableArray(prev.buildings, merged.buildings),
    waterways: stableArray(prev.waterways, merged.water),
    parks: stableArray(prev.parks, merged.parks),
    roads: stableArray(prev.roads, merged.roads),
    benches: stableArray(prev.benches, merged.benches),
    lamps: stableArray(prev.lamps, merged.lamps),
    fountains: stableArray(prev.fountains, merged.fountains),
    velibs: stableArray(prev.velibs, merged.velibs),
    busStops: stableArray(prev.busStops, merged.busStops),
    trafficLights: stableArray(prev.trafficLights, merged.trafficLights),
    shops: stableArray(prev.shops, merged.shops),
    barges: stableArray(prev.barges, merged.barges),
    locks: stableArray(prev.locks, merged.locks),
    wasteBins: stableArray(prev.wasteBins, merged.wasteBins),
    trees: stableArray(prev.trees, merged.trees),
    isLoading: !isReady,
    error,
  };
  cacheRef.current = result;

  return result;
}
