import { useMemo } from 'react';
import { EPOCH_A } from '@/constants/epochs';
import { WORLD } from '@/constants/world';
import { getHeightmapData } from '@/systems/terrainSystem';
import { buildTerrainGeometry } from '@/systems/terrainGeometry';
import { useStreamingStore } from '@/store/streamingStore';
import type { SceneWater } from '@/types/osm';

interface QuayProps {
  waterways?: SceneWater[];
}

/**
 * Terrain mesh: a subdivided plane displaced by the IGN heightmap.
 * Depresses vertices under waterways to create canal beds.
 * Falls back to a flat plane if the heightmap is not loaded.
 */
export default function Quay({ waterways }: QuayProps) {
  const isReady = useStreamingStore((s) => s.isReady);

  const geometry = useMemo(() => {
    if (!isReady) return null;
    const hm = getHeightmapData();
    if (!hm) return null;
    return buildTerrainGeometry(hm.data, hm.meta, WORLD.terrainMeshCellSize, waterways);
  }, [isReady, waterways]);

  if (!geometry) {
    // Fallback: flat plane (heightmap not loaded yet)
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD.groundLength, WORLD.groundDepth]} />
        <meshLambertMaterial color={EPOCH_A.ground} flatShading polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
    );
  }

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors flatShading polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
    </mesh>
  );
}
