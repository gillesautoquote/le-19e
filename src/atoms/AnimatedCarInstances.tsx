import { useMemo, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Object3D,
  Mesh,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Material,
  Group,
  Matrix4,
} from 'three';
import { useGLTF } from '@react-three/drei';
import { NPC } from '@/constants/npc';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadSurfaceHeight } from '@/systems/roadTileSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';
import { getAnimatedCars } from '@/systems/npcSystem';
import type { KenneyCarDef } from '@/constants/kenneyCars';

interface MeshData {
  geometry: BufferGeometry;
  material: Material;
}

const CAR_SCALE = 1.5;
const CAR_Y = 0.05;
const dummy = new Object3D();

interface AnimatedCarInstancesProps {
  modelDef: KenneyCarDef;
  variantIndex: number;
}

/** Extract meshes with baked transforms so sub-objects (wheels) keep their position. */
function extractAllMeshes(scene: Group): MeshData[] {
  const results: MeshData[] = [];
  scene.updateWorldMatrix(true, true);
  const rootInverse = new Matrix4().copy(scene.matrixWorld).invert();
  scene.traverse((node: Object3D) => {
    if ((node as Mesh).isMesh) {
      const mesh = node as Mesh;
      const geo = mesh.geometry.clone();
      const localMatrix = new Matrix4().copy(mesh.matrixWorld).premultiply(rootInverse);
      geo.applyMatrix4(localMatrix);
      results.push({ geometry: geo, material: mesh.material as Material });
    }
  });
  return results;
}

export default function AnimatedCarInstances({
  modelDef,
  variantIndex,
}: AnimatedCarInstancesProps) {
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

  useFrame(() => {
    if (refsMap.current.size === 0) return;
    const allCars = getAnimatedCars();
    let count = 0;

    for (const car of allCars) {
      if (!car.alive || car.variantIndex !== variantIndex) continue;
      const roadY = Math.max(getRoadSurfaceHeight(car.x, car.z), getRoadGradeHeight(car.x, car.z));
      const baseY = roadY > -Infinity ? roadY : getTerrainHeight(car.x, car.z) + CAR_Y;
      dummy.position.set(car.x, baseY, car.z);
      dummy.rotation.set(0, car.rotationY, 0);
      dummy.scale.setScalar(CAR_SCALE);
      dummy.updateMatrix();
      for (const [, meshRef] of refsMap.current) {
        meshRef.setMatrixAt(count, dummy.matrix);
      }
      count++;
    }

    for (const [, meshRef] of refsMap.current) {
      meshRef.count = count;
      if (count > 0) {
        meshRef.instanceMatrix.needsUpdate = true;
      }
    }
  });

  if (meshes.length === 0) return null;

  return (
    <>
      {meshes.map((mesh, idx) => (
        <instancedMesh
          key={`${modelDef.key}-anim-${idx}`}
          ref={setRef(idx)}
          args={[mesh.geometry, mesh.material, NPC.maxCars]}
          castShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
}
