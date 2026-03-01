import { useMemo, memo } from 'react';
import { DoubleSide } from 'three';
import { buildQuayWallGeometry } from '@/systems/quayGeometry';
import type { SceneWater } from '@/types/osm';

interface OSMQuayWallsProps {
  waterways: SceneWater[];
}

export default memo(function OSMQuayWalls({ waterways }: OSMQuayWallsProps) {
  const geometry = useMemo(() => {
    if (waterways.length === 0) return null;
    return buildQuayWallGeometry(waterways);
  }, [waterways]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial
        vertexColors
        flatShading
        side={DoubleSide}
      />
    </mesh>
  );
});
