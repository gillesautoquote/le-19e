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
import { useControls } from 'leva';
import { hashString } from '@/utils/geoUtils';
import { KAYKIT_TREES } from '@/constants/kaykitForest';
import type { KaykitTreeDef } from '@/constants/kaykitForest';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { SceneTree } from '@/types/osm';

interface OSMTreesProps {
  trees: SceneTree[];
}

interface MeshData {
  geometry: BufferGeometry;
  material: Material;
}

interface TreeInstance {
  x: number;
  z: number;
  scale: number;
  rotationY: number;
}

/** Extract ALL meshes from a GLB scene (multi-primitive support). */
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

// ─── Sub-component: one variant (multiple InstancedMesh) ───────────

interface TreeVariantProps {
  modelDef: KaykitTreeDef;
  instances: TreeInstance[];
}

function TreeVariantInstances({ modelDef, instances }: TreeVariantProps) {
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
        dummy.position.set(inst.x, getTerrainHeight(inst.x, inst.z), inst.z);
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
          key={`${modelDef.key}-${idx}-${instances.length}`}
          ref={setRef(idx)}
          args={[mesh.geometry, mesh.material, instances.length]}
          castShadow
        />
      ))}
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────

export default memo(function OSMTrees({ trees }: OSMTreesProps) {
  const { scaleMul, defaultHeight } = useControls('Arbres', {
    scaleMul: { value: 1, min: 0.2, max: 3, step: 0.05, label: 'Scale mult.' },
    defaultHeight: { value: 8, min: 2, max: 20, step: 0.5, label: 'Hauteur défaut' },
  });

  const grouped = useMemo(() => {
    const groups = new Map<string, TreeInstance[]>();
    for (const def of KAYKIT_TREES) groups.set(def.key, []);

    for (let i = 0; i < trees.length; i++) {
      const tree = trees[i];
      const variantIdx = hashString(tree.id ?? String(i)) % KAYKIT_TREES.length;
      const def = KAYKIT_TREES[variantIdx];
      const [x, z] = tree.position;
      const h = tree.height || defaultHeight;
      const scale = (h / def.nativeHeight) * scaleMul;

      groups.get(def.key)!.push({
        x,
        z,
        scale,
        rotationY: i * 2.3998, // golden angle
      });
    }

    return groups;
  }, [trees, scaleMul, defaultHeight]);

  return (
    <group>
      {KAYKIT_TREES.map((def) => {
        const instances = grouped.get(def.key);
        if (!instances || instances.length === 0) return null;
        return (
          <TreeVariantInstances
            key={def.key}
            modelDef={def}
            instances={instances}
          />
        );
      })}
    </group>
  );
});
