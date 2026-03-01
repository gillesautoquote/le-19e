import { useMemo, useLayoutEffect, useRef, memo } from 'react';
import {
  Object3D,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  InstancedMesh as InstancedMeshType,
  InstancedBufferAttribute,
  BufferGeometry,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import type { KenneyModuleDef } from '@/constants/kenneyModules';
import type { ModuleInstance } from '@/systems/facadeTilingSystem';

interface FacadeModuleInstancesProps {
  moduleDef: KenneyModuleDef;
  instances: ModuleInstance[];
}

interface MeshData {
  geometry: BufferGeometry;
  material: MeshLambertMaterial;
}

/** Extract first mesh and convert its material to MeshLambertMaterial. */
function extractMesh(scene: Group): MeshData | null {
  let result: MeshData | null = null;
  scene.traverse((node: Object3D) => {
    if (result) return;
    if (!(node as Mesh).isMesh) return;
    const mesh = node as Mesh;
    const src = mesh.material as MeshStandardMaterial;
    const mat = new MeshLambertMaterial({
      map: src.map ?? undefined,
      color: EPOCH_A.glbFallbackWhite,
      flatShading: true,
    });
    result = { geometry: mesh.geometry, material: mat };
  });
  return result;
}

export default memo(function FacadeModuleInstances({
  moduleDef,
  instances,
}: FacadeModuleInstancesProps) {
  const { scene } = useGLTF(moduleDef.path);
  const meshData = useMemo(() => extractMesh(scene), [scene]);
  const ref = useRef<InstancedMeshType>(null);

  useLayoutEffect(() => {
    if (!ref.current || instances.length === 0) return;
    const dummy = new Object3D();
    const colors = new Float32Array(instances.length * 3);
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      dummy.position.set(inst.x, inst.y, inst.z);
      dummy.rotation.set(0, inst.rotationY, 0);
      dummy.scale.set(inst.scaleX, inst.scaleY, inst.scaleZ);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      colors[i * 3] = inst.cr;
      colors[i * 3 + 1] = inst.cg;
      colors[i * 3 + 2] = inst.cb;
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor = new InstancedBufferAttribute(colors, 3);
  }, [instances]);

  if (!meshData || instances.length === 0) return null;

  return (
    <instancedMesh
      key={`${moduleDef.key}-${instances.length}`}
      ref={ref}
      args={[meshData.geometry, meshData.material, instances.length]}
      castShadow
      receiveShadow
    />
  );
});
