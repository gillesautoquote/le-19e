import { useMemo, useLayoutEffect, useRef, useCallback, memo } from 'react';
import { Object3D, InstancedMesh as InstancedMeshType } from 'three';
import { useGLTF } from '@react-three/drei';
import { extractAllMeshes } from '@/utils/glbHelpers';

export interface InstanceTransform {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
}

interface InstancedGLBProps {
  path: string;
  instances: InstanceTransform[];
  castShadow?: boolean;
}

export default memo(function InstancedGLB({
  path,
  instances,
  castShadow = true,
}: InstancedGLBProps) {
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
          castShadow={castShadow}
        />
      ))}
    </>
  );
});
