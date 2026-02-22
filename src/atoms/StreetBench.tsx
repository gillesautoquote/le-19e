import { useMemo, Suspense } from 'react';
import { Mesh } from 'three';
import { useGLTF } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { MODEL_PATHS, ModelErrorBoundary } from '@/hooks/useAssets';

interface StreetBenchProps {
  position: [number, number, number];
  rotation?: number;
}

const BENCH_SCALE = 1.5;

function BenchGLB({ position, rotation = 0 }: StreetBenchProps) {
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

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={clone} scale={[BENCH_SCALE, BENCH_SCALE, BENCH_SCALE]} />
    </group>
  );
}

function BenchFallback({ position, rotation = 0 }: StreetBenchProps) {
  const seatWidth = 1.5;
  const seatDepth = 0.4;
  const seatHeight = 0.05;
  const seatY = 0.45;
  const legWidth = 0.06;
  const legHeight = 0.45;

  const geometry = useMemo(() => ({
    seat: [seatWidth, seatHeight, seatDepth] as [number, number, number],
    backrest: [seatWidth, 0.4, 0.04] as [number, number, number],
    leg: [legWidth, legHeight, legWidth] as [number, number, number],
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, seatY, 0]} castShadow receiveShadow>
        <boxGeometry args={geometry.seat} />
        <meshLambertMaterial color={EPOCH_A.benchWood} flatShading />
      </mesh>
      <mesh position={[0, seatY + 0.22, -seatDepth / 2 + 0.02]} castShadow>
        <boxGeometry args={geometry.backrest} />
        <meshLambertMaterial color={EPOCH_A.benchWood} flatShading />
      </mesh>
      {([-0.6, 0.6] as const).map((xOff) =>
        ([-0.12, 0.12] as const).map((zOff) => (
          <mesh
            key={`${xOff}-${zOff}`}
            position={[xOff, legHeight / 2, zOff]}
            castShadow
          >
            <boxGeometry args={geometry.leg} />
            <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
          </mesh>
        ))
      )}
    </group>
  );
}

export default function StreetBench({ position, rotation = 0 }: StreetBenchProps) {
  const fallback = <BenchFallback position={position} rotation={rotation} />;
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <BenchGLB position={position} rotation={rotation} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
