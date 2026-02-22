import { useMemo, Suspense } from 'react';
import { Mesh, MeshLambertMaterial } from 'three';
import { useGLTF } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { MODEL_PATHS, ModelErrorBoundary } from '@/hooks/useAssets';

interface LamppostProps {
  position: [number, number, number];
  rotation?: number;
}

// Kenney curved light is roughly 4 units tall
const MODEL_NATIVE_HEIGHT = 4;
const TARGET_HEIGHT = 4.2;

// --- GLB version (using original Kenney materials) ---
function LamppostModel({ position, rotation = 0 }: LamppostProps) {
  const { scene } = useGLTF(MODEL_PATHS.lightCurved);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((node) => {
      if ((node as Mesh).isMesh) {
        const mesh = node as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  const scale = TARGET_HEIGHT / MODEL_NATIVE_HEIGHT;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={clone} scale={[scale, scale, scale]} />
    </group>
  );
}

// --- Procedural fallback ---
function LamppostProcedural({ position, rotation = 0 }: LamppostProps) {
  const { poleMat, lampMat } = useMemo(() => ({
    poleMat: new MeshLambertMaterial({ color: EPOCH_A.lampPost, flatShading: true }),
    lampMat: new MeshLambertMaterial({ color: EPOCH_A.lampHead, flatShading: true }),
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.1, 0]} material={poleMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.2, 6]} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 2.1, 0]} material={poleMat} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 4, 6]} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.3, 4, 0]} rotation={[0, 0, Math.PI / 4]} material={poleMat} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 4]} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[0.5, 4.15, 0]} material={lampMat} castShadow>
        <boxGeometry args={[0.35, 0.25, 0.35]} />
      </mesh>
    </group>
  );
}

// --- Public Lamppost atom (GLB with fallback) ---
export default function Lamppost(props: LamppostProps) {
  const fallback = <LamppostProcedural {...props} />;
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LamppostModel {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
