import { useMemo, Suspense } from 'react';
import { Mesh } from 'three';
import { useGLTF } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { MODEL_PATHS, ModelErrorBoundary } from '@/hooks/useAssets';

interface StreetWasteBinProps {
  position: [number, number, number];
}

const TRASHCAN_SCALE = 0.8;

function WasteBinGLB({ position }: StreetWasteBinProps) {
  const { scene } = useGLTF(MODEL_PATHS.trashcan);

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
    <group position={position}>
      <primitive object={clone} scale={[TRASHCAN_SCALE, TRASHCAN_SCALE, TRASHCAN_SCALE]} />
    </group>
  );
}

function WasteBinFallback({ position }: StreetWasteBinProps) {
  const binRadius = 0.18;
  const binHeight = 0.65;
  const lidRadius = 0.2;
  const lidHeight = 0.05;

  const geometry = useMemo(() => ({
    body: [binRadius, binRadius, binHeight, 8] as [number, number, number, number],
    lid: [lidRadius, lidRadius, lidHeight, 8] as [number, number, number, number],
  }), []);

  return (
    <group position={position}>
      <mesh position={[0, binHeight / 2, 0]} castShadow>
        <cylinderGeometry args={geometry.body} />
        <meshLambertMaterial color={EPOCH_A.wasteBin} flatShading />
      </mesh>
      <mesh position={[0, binHeight + lidHeight / 2, 0]}>
        <cylinderGeometry args={geometry.lid} />
        <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
      </mesh>
    </group>
  );
}

export default function StreetWasteBin({ position }: StreetWasteBinProps) {
  const fallback = <WasteBinFallback position={position} />;
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <WasteBinGLB position={position} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
