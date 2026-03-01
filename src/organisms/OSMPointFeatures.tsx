import { useMemo, memo } from 'react';
import { useControls, folder } from 'leva';
import { buildPointFeatureGeometry } from '@/utils/pointFeatureGeometry';
import ShopInstances from '@/atoms/ShopInstances';
import InstancedGLB from '@/molecules/InstancedGLB';
import { KAYKIT_TRAFFIC_LIGHTS, KAYKIT_TRASH } from '@/constants/kaykitUrban';
import { KENNEY_BOATS } from '@/constants/kenneyWatercraft';
import { hashString } from '@/utils/geoUtils';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadSurfaceHeight } from '@/systems/roadTileSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';
import type {
  SceneFountain, SceneVelib, SceneBusStop, SceneTrafficLight,
  SceneShop, SceneBarge, SceneLock, SceneWasteBin,
} from '@/types/osm';
import type { InstanceTransform } from '@/molecules/InstancedGLB';

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

// ─── Merged geometry for features without GLB ───────────────────

interface MergedFeaturesProps {
  fountains: SceneFountain[];
  velibs: SceneVelib[];
  busStops: SceneBusStop[];
  locks: SceneLock[];
}

const MergedFeatures = memo(function MergedFeatures(props: MergedFeaturesProps) {
  const geometry = useMemo(
    () => buildPointFeatureGeometry(props),
    [props.fountains, props.velibs, props.busStops, props.locks],
  );

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  );
});

// ─── Main component ─────────────────────────────────────────────

export default memo(function OSMPointFeatures({
  fountains, velibs, busStops, trafficLights,
  shops, barges, locks, wasteBins,
}: OSMPointFeaturesProps) {
  const { trafficLightScale, wasteBinScale } = useControls('Feux & Poubelles', {
    trafficLightScale: { value: KAYKIT_TRAFFIC_LIGHTS[0].scale, min: 1, max: 10, step: 0.1, label: 'Feux scale' },
    wasteBinScale: { value: KAYKIT_TRASH[0].scale, min: 3, max: 30, step: 0.5, label: 'Poubelle scale' },
  });

  const trafficLightInstances = useMemo(() => {
    return trafficLights.map((t, i) => {
      const [x, z] = t.position;
      return {
        x, z,
        y: Math.max(getTerrainHeight(x, z), getRoadSurfaceHeight(x, z), getRoadGradeHeight(x, z)),
        scale: trafficLightScale,
        rotationY: (hashString(t.id ?? String(i)) % 628) / 100,
      };
    });
  }, [trafficLights, trafficLightScale]);

  const wasteBinInstances = useMemo(() => {
    return wasteBins.map((w, i) => {
      const [x, z] = w.position;
      return {
        x, z,
        y: Math.max(getTerrainHeight(x, z), getRoadSurfaceHeight(x, z), getRoadGradeHeight(x, z)),
        scale: wasteBinScale,
        rotationY: (hashString(w.id ?? String(i)) % 628) / 100,
      };
    });
  }, [wasteBins, wasteBinScale]);

  const bargeInstances = useMemo(() => {
    const groups = new Map<string, InstanceTransform[]>();
    for (const def of KENNEY_BOATS) groups.set(def.key, []);

    for (let i = 0; i < barges.length; i++) {
      const b = barges[i];
      const [x, z] = b.position;
      const variant = b.isTourBoat
        ? KENNEY_BOATS[2]
        : KENNEY_BOATS[hashString(b.id ?? String(i)) % 2];
      const lengthScale = b.length / variant.nativeLength;

      groups.get(variant.key)!.push({
        x, z, y: -0.3, scale: lengthScale,
        rotationY: (hashString(b.id ?? String(i)) % 628) / 100,
      });
    }
    return groups;
  }, [barges]);

  return (
    <group>
      <MergedFeatures
        fountains={fountains} velibs={velibs}
        busStops={busStops} locks={locks}
      />
      {shops.length > 0 && <ShopInstances shops={shops} />}
      {trafficLightInstances.length > 0 && (
        <InstancedGLB path={KAYKIT_TRAFFIC_LIGHTS[0].path} instances={trafficLightInstances} />
      )}
      {wasteBinInstances.length > 0 && (
        <InstancedGLB path={KAYKIT_TRASH[0].path} instances={wasteBinInstances} />
      )}
      {KENNEY_BOATS.map((def) => {
        const instances = bargeInstances.get(def.key);
        if (!instances || instances.length === 0) return null;
        return <InstancedGLB key={def.key} path={def.path} instances={instances} />;
      })}
    </group>
  );
});
