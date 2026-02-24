import { useMemo, useLayoutEffect, useRef, useCallback, memo } from 'react';
import {
  Object3D,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  InstancedMesh as InstancedMeshType,
  InstancedBufferAttribute,
  BufferGeometry,
  Color,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import { SHOP_MODELS } from '@/constants/kenneyShops';
import { MODEL_PATHS } from '@/hooks/useAssets';
import { hashString } from '@/utils/geoUtils';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { SceneShop } from '@/types/osm';

interface ShopInstance {
  x: number; y: number; z: number;
  scale: number; rotationY: number;
  cr: number; cg: number; cb: number;
}

interface ShopGroup { path: string; instances: ShopInstance[]; }

function extractMeshData(scene: Group): { geometry: BufferGeometry; material: MeshLambertMaterial }[] {
  const out: { geometry: BufferGeometry; material: MeshLambertMaterial }[] = [];
  scene.traverse((n: Object3D) => {
    if (!(n as Mesh).isMesh) return;
    const src = (n as Mesh).material as MeshStandardMaterial;
    out.push({
      geometry: (n as Mesh).geometry,
      material: new MeshLambertMaterial({ map: src.map ?? undefined, color: 0xffffff, flatShading: true }),
    });
  });
  return out;
}

// ─── Per-model-type renderer ────────────────────────────────────

function ShopModelLayer({ path, instances }: ShopGroup) {
  const { scene } = useGLTF(path);
  const meshes = useMemo(() => extractMeshData(scene), [scene]);
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
    const cols = new Float32Array(instances.length * 3);
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      cols[i * 3] = inst.cr; cols[i * 3 + 1] = inst.cg; cols[i * 3 + 2] = inst.cb;
    }
    const attr = new InstancedBufferAttribute(cols, 3);
    for (const [, ref] of refsMap.current) {
      for (let i = 0; i < instances.length; i++) {
        const inst = instances[i];
        dummy.position.set(inst.x, inst.y, inst.z);
        dummy.scale.setScalar(inst.scale);
        dummy.rotation.set(0, inst.rotationY, 0);
        dummy.updateMatrix();
        ref.setMatrixAt(i, dummy.matrix);
      }
      ref.instanceMatrix.needsUpdate = true;
      ref.instanceColor = attr;
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

// ─── Main component ─────────────────────────────────────────────

const tmpColor = new Color();
const AWNING_HEIGHT = 3.2;
const AWNING_SCALE = 1.8;

export default memo(function ShopInstances({ shops }: { shops: SceneShop[] }) {
  const { groups, awnings } = useMemo(() => {
    const map = new Map<string, ShopGroup>();
    const awn: ShopInstance[] = [];

    for (const s of shops) {
      const mapping = SHOP_MODELS[s.type] ?? SHOP_MODELS.other;
      const model = mapping.model;
      const scale = mapping.targetHeight / model.nativeHeight;

      let group = map.get(model.key);
      if (!group) {
        group = { path: model.path, instances: [] };
        map.set(model.key, group);
      }

      tmpColor.set(mapping.color);
      const [x, z] = s.position;
      const y = getTerrainHeight(x, z);
      const rot = (hashString(s.id) % 628) / 100;
      group.instances.push({
        x, z, y, scale, rotationY: rot,
        cr: tmpColor.r, cg: tmpColor.g, cb: tmpColor.b,
      });

      if (mapping.awning) {
        awn.push({
          x, z, y: y + AWNING_HEIGHT, scale: AWNING_SCALE, rotationY: rot,
          cr: tmpColor.r, cg: tmpColor.g, cb: tmpColor.b,
        });
      }
    }

    return { groups: map, awnings: awn };
  }, [shops]);

  return (
    <>
      {Array.from(groups.values()).map((group) => (
        <ShopModelLayer key={group.path} path={group.path} instances={group.instances} />
      ))}
      {awnings.length > 0 && (
        <ShopModelLayer path={MODEL_PATHS.awning} instances={awnings} />
      )}
    </>
  );
});
