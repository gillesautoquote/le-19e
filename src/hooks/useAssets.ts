import { Component, ReactNode } from 'react';
import { useGLTF, useProgress } from '@react-three/drei';
import { KAYKIT_TREES, KAYKIT_BUSHES, KAYKIT_GRASS } from '@/constants/kaykitForest';
import { KAYKIT_ROCKS } from '@/constants/kaykitRocks';
import { KAYKIT_STATIC_CARS } from '@/constants/kaykitCars';
import { ALL_PARK_TILES } from '@/constants/kaykitParks';
import { KENNEY_CARS } from '@/constants/kenneyCars';
import { ALL_ROAD_GRID_TILES, LEGACY_ROAD_TILES } from '@/constants/kenneyRoads';
import { KENNEY_BOATS } from '@/constants/kenneyWatercraft';
import { ALL_KAYKIT_URBAN } from '@/constants/kaykitUrban';
import { ALL_FACADE_MODULES } from '@/constants/kenneyModules';
import { SHOP_MODEL_PATHS } from '@/constants/kenneyShops';

export const MODEL_PATHS = {
  // Street lights — Kenney roads kit
  lightCurved: '/models/kenney/roads/light-curved.glb',
  lightCurvedDouble: '/models/kenney/roads/light-curved-double.glb',

  // Street furniture — no texture needed (stay in root)
  bench: '/models/kenney/bench.glb',
  trashcan: '/models/kenney/trashcan.glb',

  // Shop details — Kenney commercial kit
  awning: '/models/kenney/commercial/detail-awning.glb',
  awningWide: '/models/kenney/commercial/detail-awning-wide.glb',

  // Mixamo animated character
  characterIdle: '/models/mixamo/idle.glb',
  characterWalk: '/models/mixamo/walking.glb',
} as const;

// Preload all models at module level
Object.values(MODEL_PATHS).forEach((path) => {
  useGLTF.preload(path);
});
KAYKIT_TREES.forEach((def) => {
  useGLTF.preload(def.path);
});
KAYKIT_BUSHES.forEach((def) => {
  useGLTF.preload(def.path);
});
KAYKIT_GRASS.forEach((def) => {
  useGLTF.preload(def.path);
});
KAYKIT_ROCKS.forEach((def) => {
  useGLTF.preload(def.path);
});
KAYKIT_STATIC_CARS.forEach((def) => {
  useGLTF.preload(def.path);
});
ALL_PARK_TILES.forEach((def) => {
  useGLTF.preload(def.path);
});
KENNEY_CARS.forEach((def) => {
  useGLTF.preload(def.path);
});
ALL_ROAD_GRID_TILES.forEach((def) => {
  useGLTF.preload(def.path);
});
LEGACY_ROAD_TILES.forEach((def) => {
  useGLTF.preload(def.path);
});
KENNEY_BOATS.forEach((def) => {
  useGLTF.preload(def.path);
});
ALL_KAYKIT_URBAN.forEach((def) => {
  useGLTF.preload(def.path);
});
ALL_FACADE_MODULES.forEach((def) => {
  useGLTF.preload(def.path);
});
SHOP_MODEL_PATHS.forEach((path) => {
  useGLTF.preload(path);
});

interface AssetsState {
  isLoaded: boolean;
  progress: number;
}

export function useAssets(): AssetsState {
  const { progress } = useProgress();
  return {
    isLoaded: progress >= 100,
    progress: progress / 100,
  };
}

// Error boundary for graceful fallback when GLB models fail to load
interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

export class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
