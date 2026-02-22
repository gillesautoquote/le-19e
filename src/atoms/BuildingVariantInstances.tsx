import { useMemo, useLayoutEffect, useRef } from 'react';
import {
  Object3D,
  Mesh,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Material,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import type { KenneyBuildingDef } from '@/constants/kenneyBuildings';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { SceneBuilding } from '@/types/osm';

/** Pre-computed instance data for a single building. */
export interface BuildingInstance {
  building: SceneBuilding;
  modelKey: string;
  cx: number;
  cz: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

interface BuildingVariantProps {
  modelDef: KenneyBuildingDef;
  instances: BuildingInstance[];
}

/** Extract first mesh geometry + material from a GLB scene. */
function extractMesh(scene: Group): {
  geometry: BufferGeometry;
  material: Material;
} | null {
  let result: { geometry: BufferGeometry; material: Material } | null = null;
  scene.traverse((node: Object3D) => {
    if (!result && (node as Mesh).isMesh) {
      const mesh = node as Mesh;
      result = {
        geometry: mesh.geometry,
        material: mesh.material as Material,
      };
    }
  });
  return result;
}

export default function BuildingVariantInstances({ modelDef, instances }: BuildingVariantProps) {
  const { scene } = useGLTF(modelDef.path);
  const meshData = useMemo(() => extractMesh(scene), [scene]);
  const ref = useRef<InstancedMeshType>(null);

  useLayoutEffect(() => {
    if (!ref.current || instances.length === 0) return;

    const dummy = new Object3D();

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      dummy.position.set(inst.cx, getTerrainHeight(inst.cx, inst.cz), inst.cz);
      dummy.rotation.set(0, inst.angle, 0);
      dummy.scale.set(inst.scaleX, inst.scaleY, inst.scaleZ);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }

    ref.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  if (!meshData) return null;

  return (
    <instancedMesh
      key={`${modelDef.key}-${instances.length}`}
      ref={ref}
      args={[meshData.geometry, meshData.material, instances.length]}
      castShadow
      receiveShadow
    />
  );
}
