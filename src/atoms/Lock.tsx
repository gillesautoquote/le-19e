import { useMemo } from 'react';
import { EPOCH_A } from '@/constants/epochs';

interface LockProps {
  position: [number, number, number];
  isOpen?: boolean;
}

/**
 * Canal lock (écluse) — two large gates that close across the canal.
 * Each gate: tall wooden panel on metal hinges.
 */
export function Lock({ position, isOpen = false }: LockProps) {
  const gateWidth = 8;
  const gateHeight = 3;
  const gateThickness = 0.5;
  const wallLength = 12;
  const wallHeight = 2;
  const wallThickness = 1.5;

  const openAngle = isOpen ? Math.PI / 3 : 0;

  const geo = useMemo(() => ({
    gate: [gateWidth, gateHeight, gateThickness] as [number, number, number],
    hinge: [0.12, 0.12, gateHeight, 6] as [number, number, number, number],
    wall: [wallLength, wallHeight, wallThickness] as [number, number, number],
    capstone: [wallLength + 0.4, 0.2, wallThickness + 0.2] as [number, number, number],
    bollard: [0.2, 0.2, 0.8, 8] as [number, number, number, number],
  }), []);

  return (
    <group position={position}>
      {/* Lock walls (north and south) */}
      {([1, -1] as const).map((side) => (
        <group key={side}>
          {/* Wall */}
          <mesh
            position={[0, wallHeight / 2, side * (gateWidth + wallThickness / 2)]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={geo.wall} />
            <meshLambertMaterial color={EPOCH_A.ground} flatShading />
          </mesh>

          {/* Capstone */}
          <mesh position={[0, wallHeight + 0.1, side * (gateWidth + wallThickness / 2)]}>
            <boxGeometry args={geo.capstone} />
            <meshLambertMaterial color={EPOCH_A.groundEdge} flatShading />
          </mesh>

          {/* Bollards */}
          {([-4, 0, 4] as const).map((xOff) => (
            <mesh
              key={xOff}
              position={[xOff, wallHeight + 0.6, side * (gateWidth + wallThickness / 2)]}
              castShadow
            >
              <cylinderGeometry args={geo.bollard} />
              <meshLambertMaterial color={EPOCH_A.lockMetal} flatShading />
            </mesh>
          ))}
        </group>
      ))}

      {/* Left gate */}
      <group position={[0, 0, 0]} rotation={[0, -openAngle, 0]}>
        <mesh position={[0, gateHeight / 2, -gateWidth / 2]} castShadow>
          <boxGeometry args={geo.gate} />
          <meshLambertMaterial color={EPOCH_A.lockWood} flatShading />
        </mesh>
        {/* Hinge */}
        <mesh position={[0, gateHeight / 2, 0]}>
          <cylinderGeometry args={geo.hinge} />
          <meshLambertMaterial color={EPOCH_A.lockMetal} flatShading />
        </mesh>
      </group>

      {/* Right gate */}
      <group position={[0, 0, 0]} rotation={[0, openAngle, 0]}>
        <mesh position={[0, gateHeight / 2, gateWidth / 2]} castShadow>
          <boxGeometry args={geo.gate} />
          <meshLambertMaterial color={EPOCH_A.lockWood} flatShading />
        </mesh>
        {/* Hinge */}
        <mesh position={[0, gateHeight / 2, 0]}>
          <cylinderGeometry args={geo.hinge} />
          <meshLambertMaterial color={EPOCH_A.lockMetal} flatShading />
        </mesh>
      </group>
    </group>
  );
}
