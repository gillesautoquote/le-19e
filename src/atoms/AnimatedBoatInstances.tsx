import { useMemo, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Object3D,
  Mesh,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Material,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import { WORLD } from '@/constants/world';
import { NPC } from '@/constants/npc';
import { getAnimatedBoats } from '@/systems/npcSystem';
import type { KenneyBoatDef } from '@/constants/kenneyWatercraft';

interface MeshData {
  geometry: BufferGeometry;
  material: Material;
}

const BOAT_SCALE = 1.5;
const BOAT_Y = WORLD.waterY + 0.15;
const dummy = new Object3D();

interface BoatVariantProps {
  modelDef: KenneyBoatDef;
  variantIndex: number;
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

export default function BoatVariantInstances({
  modelDef,
  variantIndex,
}: BoatVariantProps) {
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
    const allBoats = getAnimatedBoats();
    let count = 0;

    for (const boat of allBoats) {
      if (!boat.alive || boat.variantIndex !== variantIndex) continue;
      dummy.position.set(boat.x, BOAT_Y, boat.z);
      dummy.rotation.set(boat.rockAngle, boat.rotationY, 0);
      dummy.scale.setScalar(BOAT_SCALE);
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
          key={`${modelDef.key}-boat-${idx}`}
          ref={setRef(idx)}
          args={[mesh.geometry, mesh.material, NPC.boatCount]}
          castShadow
          frustumCulled={false}
        />
      ))}
    </>
  );
}
