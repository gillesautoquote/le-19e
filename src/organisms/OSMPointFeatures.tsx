import { useMemo, memo } from 'react';
import { buildPointFeatureGeometry } from '@/utils/pointFeatureGeometry';
import type {
  SceneFountain,
  SceneVelib,
  SceneBusStop,
  SceneTrafficLight,
  SceneShop,
  SceneBarge,
  SceneLock,
  SceneWasteBin,
} from '@/types/osm';

interface OSMPointFeaturesProps {
  fountains: SceneFountain[];
  velibs: SceneVelib[];
  busStops: SceneBusStop[];
  trafficLights: SceneTrafficLight[];
  shops: SceneShop[];
  barges: SceneBarge[];
  locks: SceneLock[];
  wasteBins: SceneWasteBin[];
}

export default memo(function OSMPointFeatures({
  fountains,
  velibs,
  busStops,
  trafficLights,
  shops,
  barges,
  locks,
  wasteBins,
}: OSMPointFeaturesProps) {
  const geometry = useMemo(
    () => buildPointFeatureGeometry({
      fountains, velibs, busStops, trafficLights,
      shops, barges, locks, wasteBins,
    }),
    [fountains, velibs, busStops, trafficLights, shops, barges, locks, wasteBins],
  );

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  );
});
