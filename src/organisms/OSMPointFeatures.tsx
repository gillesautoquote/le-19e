import { useMemo, useLayoutEffect, useRef, useCallback, memo } from 'react';
import { Object3D, Mesh, InstancedMesh as InstancedMeshType, BufferGeometry, Material, Group } from 'three';
import { useGLTF } from '@react-three/drei';
import { buildPointFeatureGeometry } from '@/utils/pointFeatureGeometry';
import ShopInstances from '@/atoms/ShopInstances';
import { KAYKIT_TRAFFIC_LIGHTS, KAYKIT_TRASH } from '@/constants/kaykitUrban';
import { KENNEY_BOATS } from '@/constants/kenneyWatercraft';
import { hashString } from '@/utils/geoUtils';
import { getTerrainHeight } from '@/systems/terrainSystem';
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

// ─── Helpers ────────────────────────────────────────────────────

interface MeshData {
  geometry: BufferGeometry;
  material: Material;
}

function extractAllMeshes(scene: Group): MeshData[] {
  const results: MeshData[] = [];
  scene.traverse((node: Object3D) => {
    if ((node as Mesh).isMesh) {
      const mesh = node as Mesh;
      results.push({ geometry: mesh.geometry, material: mesh.material as Material });
    }
  });
  return results;
}

interface InstanceData {
  x: number;
  z: number;
  y: number;
  scale: number;
  rotationY: number;
}

// ─── Generic instanced GLB sub-component ────────────────────────

interface InstancedModelProps {
  path: string;
  instances: InstanceData[];
}

function InstancedModel({ path, instances }: InstancedModelProps) {
  const { scene } = useGLTF(path);
  const meshes = useMemo(() => extractAllMeshes(scene), [scene]);
  const refsMap = useRef<Map<number, InstancedMeshType>>(new Map());

  const setRef = useCallback(
    (idx: number) => (el: InstancedMeshType | null) => {
      if (el) refsMap.current.set(idx, el);
      else refsMap.current.delete(idx);
    },
    [],
  );

  useLayoutEffect(() => {
    if (instances.length === 0) return;
    const dummy = new Object3D();

    for (const [, meshRef] of refsMap.current) {
      for (let i = 0; i < instances.length; i++) {
        const inst = instances[i];
        dummy.position.set(inst.x, inst.y, inst.z);
        dummy.scale.setScalar(inst.scale);
        dummy.rotation.set(0, inst.rotationY, 0);
        dummy.updateMatrix();
        meshRef.setMatrixAt(i, dummy.matrix);
      }
      meshRef.instanceMatrix.needsUpdate = true;
    }
  }, [instances]);

  if (meshes.length === 0 || instances.length === 0) return null;

  return (
    <>
      {meshes.map((mesh, idx) => (
        <instancedMesh
          key={`${path}-${idx}-${instances.length}`}
          ref={setRef(idx)}
          args={[mesh.geometry, mesh.material, instances.length]}
          castShadow
        />
      ))}
    </>
  );
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
  // Traffic lights → KayKit instanced GLB
  const trafficLightInstances = useMemo(() => {
    const def = KAYKIT_TRAFFIC_LIGHTS[0];
    return trafficLights.map((t, i) => {
      const [x, z] = t.position;
      return {
        x, z,
        y: getTerrainHeight(x, z),
        scale: def.scale,
        rotationY: (hashString(t.id ?? String(i)) % 628) / 100,
      };
    });
  }, [trafficLights]);

  // Waste bins → KayKit instanced GLB
  const wasteBinInstances = useMemo(() => {
    const def = KAYKIT_TRASH[0];
    return wasteBins.map((w, i) => {
      const [x, z] = w.position;
      return {
        x, z,
        y: getTerrainHeight(x, z),
        scale: def.scale,
        rotationY: (hashString(w.id ?? String(i)) % 628) / 100,
      };
    });
  }, [wasteBins]);

  // Barges → Kenney watercraft instanced GLB
  const bargeInstances = useMemo(() => {
    const groups = new Map<string, InstanceData[]>();
    for (const def of KENNEY_BOATS) groups.set(def.key, []);

    for (let i = 0; i < barges.length; i++) {
      const b = barges[i];
      const [x, z] = b.position;
      const variant = b.isTourBoat
        ? KENNEY_BOATS[2] // tow boat for tours
        : KENNEY_BOATS[hashString(b.id ?? String(i)) % 2]; // house-a or house-b
      const lengthScale = b.length / variant.nativeLength;

      groups.get(variant.key)!.push({
        x, z,
        y: -0.3,
        scale: lengthScale,
        rotationY: (hashString(b.id ?? String(i)) % 628) / 100,
      });
    }

    return groups;
  }, [barges]);

  return (
    <group>
      {/* Merged geometry: fountains, vélibs, bus stops, locks */}
      <MergedFeatures
        fountains={fountains}
        velibs={velibs}
        busStops={busStops}
        locks={locks}
      />

      {/* Instanced Kenney commercial buildings for shops */}
      {shops.length > 0 && <ShopInstances shops={shops} />}

      {/* Instanced KayKit traffic lights */}
      {trafficLightInstances.length > 0 && (
        <InstancedModel
          path={KAYKIT_TRAFFIC_LIGHTS[0].path}
          instances={trafficLightInstances}
        />
      )}

      {/* Instanced KayKit waste bins */}
      {wasteBinInstances.length > 0 && (
        <InstancedModel
          path={KAYKIT_TRASH[0].path}
          instances={wasteBinInstances}
        />
      )}

      {/* Instanced Kenney watercraft for barges */}
      {KENNEY_BOATS.map((def) => {
        const instances = bargeInstances.get(def.key);
        if (!instances || instances.length === 0) return null;
        return (
          <InstancedModel
            key={def.key}
            path={def.path}
            instances={instances}
          />
        );
      })}
    </group>
  );
});
