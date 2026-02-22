import { useMemo, memo } from 'react';
import { Color, Float32BufferAttribute, DoubleSide, BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EPOCH_A } from '@/constants/epochs';
import { roadToGeometry } from '@/systems/ribbonGeometry';
import type { SceneRoad } from '@/types/osm';

interface OSMPathsProps {
  roads: SceneRoad[];
}

const PATH_TYPES = new Set(['footway', 'cycleway']);

const PATH_COLORS: Record<string, string> = {
  footway: EPOCH_A.roadFootway,
  cycleway: EPOCH_A.roadCycleway,
};

export default memo(function OSMPaths({ roads }: OSMPathsProps) {
  const geometry = useMemo(() => {
    const geos: BufferGeometry[] = [];

    for (const road of roads) {
      if (!PATH_TYPES.has(road.type)) continue;
      if (road.points.length < 2) continue;

      const { geometry: geo } = roadToGeometry(road);
      const hex = PATH_COLORS[road.type] ?? EPOCH_A.roadFootway;
      const color = new Color(hex);

      const count = geo.attributes.position.count;
      const colors = new Float32Array(count * 3);
      for (let j = 0; j < count * 3; j += 3) {
        colors[j] = color.r;
        colors[j + 1] = color.g;
        colors[j + 2] = color.b;
      }
      geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
      geos.push(geo);
    }

    if (geos.length === 0) return null;
    return mergeGeometries(geos, false);
  }, [roads]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors flatShading side={DoubleSide} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
});
