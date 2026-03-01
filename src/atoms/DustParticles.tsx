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
import { DUST } from '@/constants/dust';
import { EPOCH_A } from '@/constants/epochs';
import { getDust, isDustInitialized, tickDust } from '@/systems/dustSystem';
import { usePlayerStore } from '@/store/playerStore';

// ─── Shared objects (module-level, no allocation per frame) ─────

const dummy = new Object3D();

// ─── Mote geometry: tiny triangle ───────────────────────────────

function createMoteGeometry(): BufferGeometry {
  const s = DUST.particleSize;
  const geo = new BufferGeometry();
  const vertices = new Float32Array([
    0, 0, s,
    -s * 0.6, 0, -s * 0.5,
    s * 0.6, 0, -s * 0.5,
  ]);
  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

// ─── Component ──────────────────────────────────────────────────

export default memo(function DustParticles() {
  const meshRef = useRef<InstancedMeshType>(null);

  const moteGeo = useMemo(() => createMoteGeometry(), []);

  const material = useMemo(() =>
    new MeshLambertMaterial({
      color: new Color(EPOCH_A.leafMote),
      flatShading: true,
      side: DoubleSide,
      transparent: true,
      opacity: 0.4,
    }), []);

  useFrame((_, delta) => {
    if (!isDustInitialized()) return;
    if (!meshRef.current) return;

    const [px, , pz] = usePlayerStore.getState().position;
    tickDust(delta, px, pz);

    const allMotes = getDust();
    let count = 0;

    for (const mote of allMotes) {
      dummy.position.set(mote.worldX, mote.worldY, mote.worldZ);
      dummy.rotation.set(
        Math.sin(mote.localTime * 0.5) * 0.3,
        mote.localTime * 0.2,
        0,
      );
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(count, dummy.matrix);
      count++;
    }

    meshRef.current.count = count;
    if (count > 0) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[moteGeo, material, DUST.count]}
      frustumCulled={false}
    />
  );
});
