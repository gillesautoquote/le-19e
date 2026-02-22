import { useMemo, Suspense } from 'react';
import { Mesh, MeshLambertMaterial } from 'three';
import { useGLTF } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { MODEL_PATHS, ModelErrorBoundary } from '@/hooks/useAssets';

interface BenchProps {
  position: [number, number, number];
  rotation?: number;
}

// Kenney bench is roughly 1.0 unit wide, 0.5 units tall
const MODEL_NATIVE_WIDTH = 1.0;
const TARGET_WIDTH = 1.5;

// --- GLB version (using original Kenney materials) ---
function BenchModel({ position, rotation = 0 }: BenchProps) {
  const { scene } = useGLTF(MODEL_PATHS.bench);

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

  const scale = TARGET_WIDTH / MODEL_NATIVE_WIDTH;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={clone} scale={[scale, scale, scale]} />
    </group>
  );
}

// --- Procedural fallback ---
function BenchProcedural({ position, rotation = 0 }: BenchProps) {
  const { woodMat, metalMat } = useMemo(() => ({
    woodMat: new MeshLambertMaterial({ color: EPOCH_A.benchWood, flatShading: true }),
    metalMat: new MeshLambertMaterial({ color: EPOCH_A.benchMetal, flatShading: true }),
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} material={woodMat} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.08, 0.5]} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.75, -0.2]} material={woodMat} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.5, 0.05]} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.6, 0.22, 0]} material={metalMat} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.45, 0.4]} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.6, 0.22, 0]} material={metalMat} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.45, 0.4]} />
      </mesh>
    </group>
  );
}

// --- Public Bench atom (GLB with fallback) ---
export default function Bench(props: BenchProps) {
  const fallback = <BenchProcedural {...props} />;
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <BenchModel {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
