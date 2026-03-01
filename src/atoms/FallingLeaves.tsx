import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Object3D,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Float32BufferAttribute,
  MeshLambertMaterial,
  DoubleSide,
  Color,
} from 'three';
import { LEAVES } from '@/constants/leaves';
import { EPOCH_A } from '@/constants/epochs';
import { getLeaves, isLeavesInitialized, tickLeaves } from '@/systems/leafSystem';
import { usePlayerStore } from '@/store/playerStore';

// ─── Shared objects (module-level, no allocation per frame) ─────

const dummy = new Object3D();

const LEAF_COLOR_KEYS = [
  'leafA', 'leafB', 'leafC', 'leafD', 'leafE', 'leafMote',
] as const;

// ─── Leaf geometry: kite/diamond silhouette (non-indexed) ───────

function createLeafGeometry(): BufferGeometry {
  const s = LEAVES.leafSize;
  const geo = new BufferGeometry();
  // Kite shape: pointed tip, wide upper third, tapers to base
  const tip   = [0,         0, s * 1.0 ] as const;
  const left  = [-s * 0.55, 0, s * 0.15] as const;
  const right = [s * 0.55,  0, s * 0.15] as const;
  const base  = [0,         0, -s * 0.65] as const;

  const vertices = new Float32Array([
    ...tip,  ...left, ...right,   // upper triangle
    ...left, ...base, ...right,   // lower triangle
  ]);
  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

// ─── Component ──────────────────────────────────────────────────

export default memo(function FallingLeaves() {
  const refsMap = useRef<Map<number, InstancedMeshType>>(new Map());

  const leafGeo = useMemo(() => createLeafGeometry(), []);

  const materials = useMemo(() =>
    LEAF_COLOR_KEYS.map((key) =>
      new MeshLambertMaterial({
        color: new Color(EPOCH_A[key]),
        flatShading: true,
        side: DoubleSide,
        transparent: true,
        opacity: 0.85,
      }),
    ), []);

  // Per-variant instance counts (recycled each frame)
  const counts = useMemo(() => new Int32Array(LEAVES.colorVariantCount), []);

  useFrame((_, delta) => {
    if (!isLeavesInitialized()) return;
    if (refsMap.current.size === 0) return;

    const [px, , pz] = usePlayerStore.getState().position;
    tickLeaves(delta, px, pz);

    const allLeaves = getLeaves();

    // Reset counts
    counts.fill(0);

    // Set matrices per variant
    for (const leaf of allLeaves) {
      const meshRef = refsMap.current.get(leaf.colorVariant);
      if (!meshRef) continue;
      const i = counts[leaf.colorVariant];

      dummy.position.set(leaf.worldX, leaf.worldY, leaf.worldZ);
      dummy.rotation.set(0, leaf.rotationY, leaf.rotationZ);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.setMatrixAt(i, dummy.matrix);
      counts[leaf.colorVariant]++;
    }

    // Update instance counts and flag for GPU upload
    for (const [variant, meshRef] of refsMap.current) {
      meshRef.count = counts[variant];
      if (counts[variant] > 0) {
        meshRef.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group frustumCulled={false}>
      {materials.map((mat, idx) => (
        <instancedMesh
          key={`leaf-variant-${idx}`}
          ref={(el: InstancedMeshType | null) => {
            if (el) refsMap.current.set(idx, el);
            else refsMap.current.delete(idx);
          }}
          args={[leafGeo, mat, LEAVES.count]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
});
