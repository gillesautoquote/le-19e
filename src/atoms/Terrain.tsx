import { useMemo, memo } from 'react';
import { EPOCH_A, EPOCH_B } from '@/constants/epochs';
import { WORLD } from '@/constants/world';
import { useWorldStore } from '@/store/worldStore';
import { getHeightmapData } from '@/systems/terrainSystem';
import { buildTerrainGeometry } from '@/systems/terrainGeometry';
import type { SceneWater } from '@/types/osm';

interface TerrainProps {
  waterways: SceneWater[];
}

export default memo(function Terrain({ waterways }: TerrainProps) {
  const epoch = useWorldStore((s) => s.epoch);
  const palette = epoch === 'A' ? EPOCH_A : EPOCH_B;

  const geometry = useMemo(() => {
    const hm = getHeightmapData();
    if (!hm) return null;

    return buildTerrainGeometry(
      hm.data,
      hm.meta,
      WORLD.terrainMeshCellSize,
      waterways,
      palette.ground,
      palette.terrainHigh,
    );
  }, [waterways, palette.ground, palette.terrainHigh]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  );
});
