import { useMemo, useLayoutEffect, useRef, useCallback } from 'react';
import {
  Object3D,
  Mesh,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Material,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import type { KenneyCarDef } from '@/constants/kenneyCars';
import { getTerrainHeight } from '@/systems/terrainSystem';

export interface CarInstance {
  x: number;
  z: number;
  rotationY: number;
}

interface MeshData {
  geometry: BufferGeometry;
  material: Material;
}

const CAR_SCALE = 1.5;
const CAR_Y = 0.05;

interface CarVariantProps {
  modelDef: KenneyCarDef;
  instances: CarInstance[];
}

/** Extract ALL meshes from a GLB scene. */
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

export default function CarVariantInstances({ modelDef, instances }: CarVariantProps) {
  const { scene } = useGLTF(modelDef.path);
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
        dummy.position.set(inst.x, getTerrainHeight(inst.x, inst.z) + CAR_Y, inst.z);
        dummy.scale.setScalar(CAR_SCALE);
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
          key={`${modelDef.key}-${idx}-${instances.length}`}
          ref={setRef(idx)}
          args={[mesh.geometry, mesh.material, instances.length]}
          castShadow
        />
      ))}
    </>
  );
}
