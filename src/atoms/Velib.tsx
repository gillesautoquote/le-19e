import { useMemo } from 'react';
import { EPOCH_A } from '@/constants/epochs';

interface VelibProps {
  position: [number, number, number];
  count?: number;
}

/**
 * A single Vélib' bike on its dock.
 * Low poly: two wheels (torus), frame (box), seat (small box), handlebars (box).
 */
export function Velib({ position, count = 1 }: VelibProps) {
  const geo = useMemo(() => ({
    wheel: [0.28, 0.03, 8, 4] as [number, number, number, number],
    frame: [0.5, 0.04, 0.04] as [number, number, number],
    seat: [0.1, 0.03, 0.08] as [number, number, number],
    handlebar: [0.22, 0.03, 0.03] as [number, number, number],
    dock: [0.08, 0.6, 0.08] as [number, number, number],
  }), []);

  const bikes = useMemo(() => {
    const spacing = 0.7;
    const startX = -((count - 1) * spacing) / 2;
    return Array.from({ length: count }, (_, i) => startX + i * spacing);
  }, [count]);

  return (
    <group position={position}>
      {bikes.map((xOff, i) => (
        <group key={i} position={[xOff, 0, 0]}>
          {/* Dock post */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={geo.dock} />
            <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
          </mesh>

          {/* Rear wheel */}
          <mesh position={[-0.18, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={geo.wheel} />
            <meshLambertMaterial color={EPOCH_A.velibBike} flatShading />
          </mesh>

          {/* Front wheel */}
          <mesh position={[0.18, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={geo.wheel} />
            <meshLambertMaterial color={EPOCH_A.velibBike} flatShading />
          </mesh>

          {/* Frame */}
          <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0.15]} castShadow>
            <boxGeometry args={geo.frame} />
            <meshLambertMaterial color={EPOCH_A.velibStation} flatShading />
          </mesh>

          {/* Seat */}
          <mesh position={[-0.12, 0.52, 0]}>
            <boxGeometry args={geo.seat} />
            <meshLambertMaterial color={EPOCH_A.velibBike} flatShading />
          </mesh>

          {/* Handlebars */}
          <mesh position={[0.2, 0.52, 0]}>
            <boxGeometry args={geo.handlebar} />
            <meshLambertMaterial color={EPOCH_A.velibBike} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}
