import { Component, ReactNode } from 'react';
import { useGLTF, useProgress } from '@react-three/drei';
import { KENNEY_TREES } from '@/constants/kenneyTrees';
import { KENNEY_CARS } from '@/constants/kenneyCars';
import { ALL_ROAD_TILES } from '@/constants/kenneyRoads';
import { KENNEY_BOATS } from '@/constants/kenneyWatercraft';

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

  // Characters — Kenney minifigs (legacy)
  characterMale: '/models/character_male.glb',
  characterFemale: '/models/character_female.glb',

  // Mixamo animated character
  characterIdle: '/models/mixamo/idle.glb',
  characterWalk: '/models/mixamo/walking.glb',
} as const;

// Preload all models at module level
Object.values(MODEL_PATHS).forEach((path) => {
  useGLTF.preload(path);
});
KENNEY_TREES.forEach((def) => {
  useGLTF.preload(def.path);
});
KENNEY_CARS.forEach((def) => {
  useGLTF.preload(def.path);
});
ALL_ROAD_TILES.forEach((def) => {
  useGLTF.preload(def.path);
});
KENNEY_BOATS.forEach((def) => {
  useGLTF.preload(def.path);
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
