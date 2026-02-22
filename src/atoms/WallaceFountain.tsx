import { useMemo } from 'react';
import { EPOCH_A } from '@/constants/epochs';

interface WallaceFountainProps {
  position: [number, number, number];
  type?: 'wallace' | 'standard';
}

export function WallaceFountain({ position, type = 'wallace' }: WallaceFountainProps) {
  if (type === 'standard') {
    return <StandardFountain position={position} />;
  }
  return <Wallace position={position} />;
}

// ─── Wallace Fountain (iconic Paris drinking fountain) ───────────

interface WallaceProps {
  position: [number, number, number];
}

function Wallace({ position }: WallaceProps) {
  const color = EPOCH_A.fountainWallace;

  const geo = useMemo(() => ({
    base: [0.35, 0.35, 0.15, 8] as [number, number, number, number],
    pedestal: [0.12, 0.12, 0.6, 8] as [number, number, number, number],
    column: [0.08, 0.08, 1.2, 8] as [number, number, number, number],
    dome: [0.3, 0.3, 0.3, 8, 4, 0, Math.PI / 2] as [number, number, number, number, number, number, number],
    bowl: [0.25, 0.18, 0.1, 8] as [number, number, number, number],
    caryatid: [0.04, 0.04, 0.8, 6] as [number, number, number, number],
  }), []);

  return (
    <group position={position}>
      {/* Octagonal base */}
      <mesh position={[0, 0.075, 0]} castShadow receiveShadow>
        <cylinderGeometry args={geo.base} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      {/* Pedestal */}
      <mesh position={[0, 0.15 + 0.3, 0]} castShadow>
        <cylinderGeometry args={geo.pedestal} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      {/* Central column */}
      <mesh position={[0, 0.45 + 0.6, 0]} castShadow>
        <cylinderGeometry args={geo.column} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      {/* 4 caryatids (simplified as cylinders around the column) */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => {
        const cx = Math.cos(angle) * 0.16;
        const cz = Math.sin(angle) * 0.16;
        return (
          <mesh key={angle} position={[cx, 0.45 + 0.4, cz]} castShadow>
            <cylinderGeometry args={geo.caryatid} />
            <meshLambertMaterial color={color} flatShading />
          </mesh>
        );
      })}

      {/* Dome on top */}
      <mesh position={[0, 1.65 + 0.15, 0]} castShadow>
        <sphereGeometry args={geo.dome} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      {/* Collecting bowl */}
      <mesh position={[0, 0.15 + 0.05, 0]} receiveShadow>
        <cylinderGeometry args={geo.bowl} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}

// ─── Standard fountain (simple drinking water point) ─────────────

interface StandardFountainProps {
  position: [number, number, number];
}

function StandardFountain({ position }: StandardFountainProps) {
  const color = EPOCH_A.fountainStandard;

  const geo = useMemo(() => ({
    base: [0.15, 0.15, 0.08, 8] as [number, number, number, number],
    column: [0.06, 0.06, 0.9, 8] as [number, number, number, number],
    top: [0.1, 0.1, 0.06, 8] as [number, number, number, number],
  }), []);

  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={geo.base} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      <mesh position={[0, 0.08 + 0.45, 0]} castShadow>
        <cylinderGeometry args={geo.column} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      <mesh position={[0, 0.98 + 0.03, 0]}>
        <cylinderGeometry args={geo.top} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}
