import { useMemo } from 'react';
import { MeshLambertMaterial } from 'three';
import { EPOCH_A } from '@/constants/epochs';

interface BargeProps {
  position: [number, number, number];
  rotation?: number;
}

export default function Barge({ position, rotation = 0 }: BargeProps) {
  const { hullMat, cabinMat, deckMat, metalMat, ropeMat } = useMemo(() => ({
    hullMat: new MeshLambertMaterial({ color: EPOCH_A.bargeHull, flatShading: true }),
    cabinMat: new MeshLambertMaterial({ color: EPOCH_A.bargeCabin, flatShading: true }),
    deckMat: new MeshLambertMaterial({ color: EPOCH_A.benchWood, flatShading: true }),
    metalMat: new MeshLambertMaterial({ color: EPOCH_A.benchMetal, flatShading: true }),
    ropeMat: new MeshLambertMaterial({ color: EPOCH_A.trunk, flatShading: true }),
  }), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Hull — 12x2x3, partially submerged (Y=0 is waterline) */}
      <mesh position={[0, 0.3, 0]} material={hullMat} castShadow receiveShadow>
        <boxGeometry args={[12, 2, 3]} />
      </mesh>
      {/* Deck */}
      <mesh position={[0, 1.34, 0]} material={deckMat} receiveShadow>
        <boxGeometry args={[11, 0.08, 2.8]} />
      </mesh>
      {/* Cabin */}
      <mesh position={[1, 2.2, 0]} material={cabinMat} castShadow receiveShadow>
        <boxGeometry args={[5, 1.6, 2.2]} />
      </mesh>
      {/* Wheelhouse (rear) */}
      <mesh position={[4.5, 2.6, 0]} material={cabinMat} castShadow>
        <boxGeometry args={[2, 1.2, 2]} />
      </mesh>
      {/* Chimney */}
      <mesh position={[2, 3.4, 0]} material={metalMat} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 6]} />
      </mesh>
      {/* Front rope post */}
      <mesh position={[-5.5, 1.6, 0]} material={ropeMat} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 4]} />
      </mesh>
      {/* Rear rope post */}
      <mesh position={[5.5, 1.6, 0]} material={ropeMat} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 4]} />
      </mesh>
      {/* Front rope */}
      <mesh position={[-5.5, 2.1, 0]} rotation={[0, 0, 0.3]} material={ropeMat}>
        <cylinderGeometry args={[0.02, 0.02, 2.5, 3]} />
      </mesh>
      {/* Rear rope */}
      <mesh position={[5.5, 2.1, 0]} rotation={[0, 0, -0.3]} material={ropeMat}>
        <cylinderGeometry args={[0.02, 0.02, 2.5, 3]} />
      </mesh>
    </group>
  );
}
