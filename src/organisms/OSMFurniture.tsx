import { useMemo, useLayoutEffect, useRef, useCallback, memo } from 'react';
import {
  Object3D,
  Mesh,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Material,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import { useControls, folder } from 'leva';
import { KAYKIT_BENCHES, KAYKIT_STREETLIGHTS } from '@/constants/kaykitUrban';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';
import type { SceneBench, SceneLamp } from '@/types/osm';

interface OSMFurnitureProps {
  benches: SceneBench[];
  lamps: SceneLamp[];
}

interface MeshData {
  geometry: BufferGeometry;
  material: Material;
}

interface FurnitureInstance {
  x: number;
  z: number;
  y: number;
  scale: number;
  rotationY: number;
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

// ─── Generic instanced GLB sub-component ────────────────────

interface InstancedFurnitureProps {
  path: string;
  label: string;
  instances: FurnitureInstance[];
}

function InstancedFurniture({ path, label, instances }: InstancedFurnitureProps) {
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
          key={`${label}-${idx}-${instances.length}`}
          ref={setRef(idx)}
          args={[mesh.geometry, mesh.material, instances.length]}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

// ─── Main component ─────────────────────────────────────────

export default memo(function OSMFurniture({ benches, lamps }: OSMFurnitureProps) {
  const benchDef = KAYKIT_BENCHES[0];
  const lampDef = KAYKIT_STREETLIGHTS[0];

  const { benchScale, lampScale } = useControls('Bancs & Lampadaires', {
    benchScale: { value: benchDef.scale, min: 1, max: 15, step: 0.1, label: 'Banc scale' },
    lampScale: { value: lampDef.scale, min: 1, max: 15, step: 0.1, label: 'Lampadaire scale' },
  });

  const benchInstances = useMemo<FurnitureInstance[]>(() =>
    benches.map((b) => {
      const [x, z] = b.position;
      return {
        x, z,
        y: Math.max(getTerrainHeight(x, z), getRoadGradeHeight(x, z)),
        scale: benchScale,
        rotationY: b.orientation,
      };
    }),
    [benches, benchScale],
  );

  const lampInstances = useMemo<FurnitureInstance[]>(() =>
    lamps.map((l) => {
      const [x, z] = l.position;
      return {
        x, z,
        y: Math.max(getTerrainHeight(x, z), getRoadGradeHeight(x, z)),
        scale: lampScale,
        rotationY: 0,
      };
    }),
    [lamps, lampScale],
  );

  return (
    <group>
      {benchInstances.length > 0 && (
        <InstancedFurniture
          path={benchDef.path}
          label="bench"
          instances={benchInstances}
        />
      )}
      {lampInstances.length > 0 && (
        <InstancedFurniture
          path={lampDef.path}
          label="lamp"
          instances={lampInstances}
        />
      )}
    </group>
  );
});
