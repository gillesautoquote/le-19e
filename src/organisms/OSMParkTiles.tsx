import { useMemo, useLayoutEffect, useRef, useCallback, memo } from 'react';
import {
  Object3D,
  Mesh,
  MeshStandardMaterial,
  MeshLambertMaterial,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Material,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import { useControls } from 'leva';
import type { KaykitParkTileDef } from '@/constants/kaykitParks';
import {
  computeParkBaseTiles,
  computeParkWallTiles,
  getAllUsedDefs,
} from '@/systems/parkTileSystem';
import type { ParkTileInstance } from '@/systems/parkTileSystem';
import type { ScenePark } from '@/types/osm';

interface OSMParkTilesProps {
  parks: ScenePark[];
}

interface MeshData {
  geometry: BufferGeometry;
  material: Material;
}

/** Convert MeshStandardMaterial → MeshLambertMaterial (no specular shine). */
function toLambert(mat: Material): Material {
  if (mat instanceof MeshStandardMaterial) {
    const lambert = new MeshLambertMaterial({
      map: mat.map,
      color: mat.color,
      flatShading: true,
    });
    return lambert;
  }
  return mat;
}

function extractAllMeshes(scene: Group): MeshData[] {
  const results: MeshData[] = [];
  scene.traverse((node: Object3D) => {
    if ((node as Mesh).isMesh) {
      const mesh = node as Mesh;
      results.push({ geometry: mesh.geometry, material: toLambert(mesh.material as Material) });
    }
  });
  return results;
}

// ─── Sub-component: one tile variant ────────────────────────

interface TileVariantProps {
  modelDef: KaykitParkTileDef;
  instances: ParkTileInstance[];
}

function TileVariantInstances({ modelDef, instances }: TileVariantProps) {
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
          key={`${modelDef.key}-${idx}-${instances.length}`}
          ref={setRef(idx)}
          args={[mesh.geometry, mesh.material, instances.length]}
          receiveShadow
        />
      ))}
    </>
  );
}

// ─── Main component ─────────────────────────────────────────

export default memo(function OSMParkTiles({ parks }: OSMParkTilesProps) {
  const { yOffset } = useControls('Tuiles parc', {
    yOffset: { value: 0, min: -1, max: 1, step: 0.01, label: 'Offset Y' },
  });

  const allInstances = useMemo(() => {
    const baseGroups = computeParkBaseTiles(parks);
    const wallGroups = computeParkWallTiles(parks);

    // Merge both maps
    const merged = new Map<string, ParkTileInstance[]>();
    for (const [key, arr] of baseGroups) merged.set(key, arr);
    for (const [key, arr] of wallGroups) {
      const existing = merged.get(key);
      if (existing) existing.push(...arr);
      else merged.set(key, arr);
    }

    // Apply Y offset
    if (yOffset !== 0) {
      for (const [, arr] of merged) {
        for (const inst of arr) inst.y += yOffset;
      }
    }

    return merged;
  }, [parks, yOffset]);

  const defs = useMemo(() => getAllUsedDefs(), []);

  return (
    <group>
      {defs.map((def) => {
        const instances = allInstances.get(def.key);
        if (!instances || instances.length === 0) return null;
        return (
          <TileVariantInstances
            key={def.key}
            modelDef={def}
            instances={instances}
          />
        );
      })}
    </group>
  );
});
