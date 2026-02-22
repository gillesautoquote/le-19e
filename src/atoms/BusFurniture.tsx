import { useMemo } from 'react';
import { EPOCH_A } from '@/constants/epochs';

interface BusFurnitureProps {
  position: [number, number, number];
  rotation?: number;
}

/**
 * Bus shelter atom — the physical structure only.
 * Roof panel, back panel, side panels, support poles.
 * Text labels are handled by the BusStop molecule.
 */
export function BusFurniture({ position, rotation = 0 }: BusFurnitureProps) {
  const shelterWidth = 3;
  const shelterDepth = 1.2;
  const shelterHeight = 2.5;
  const roofThickness = 0.06;
  const panelThickness = 0.04;

  const geo = useMemo(() => ({
    roof: [shelterWidth, roofThickness, shelterDepth] as [number, number, number],
    backPanel: [shelterWidth, shelterHeight * 0.7, panelThickness] as [number, number, number],
    sidePanel: [panelThickness, shelterHeight * 0.7, shelterDepth] as [number, number, number],
    pole: [0.04, 0.04, shelterHeight, 4] as [number, number, number, number],
    sign: [0.5, 0.5, 0.04] as [number, number, number],
    signPole: [0.03, 0.03, 3.2, 4] as [number, number, number, number],
  }), []);

  const poleY = shelterHeight / 2;
  const roofY = shelterHeight + roofThickness / 2;
  const panelY = shelterHeight * 0.35 + shelterHeight * 0.15;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 4 support poles */}
      {([-shelterWidth / 2 + 0.1, shelterWidth / 2 - 0.1] as const).map((x) =>
        ([-shelterDepth / 2 + 0.1, shelterDepth / 2 - 0.1] as const).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, poleY, z]} castShadow>
            <cylinderGeometry args={geo.pole} />
            <meshLambertMaterial color={EPOCH_A.busShelter} flatShading />
          </mesh>
        ))
      )}

      {/* Roof */}
      <mesh position={[0, roofY, 0]} castShadow receiveShadow>
        <boxGeometry args={geo.roof} />
        <meshLambertMaterial color={EPOCH_A.busShelter} flatShading />
      </mesh>

      {/* Back panel (glass-like, semi-transparent feeling via light blue) */}
      <mesh position={[0, panelY, -shelterDepth / 2 + panelThickness / 2]}>
        <boxGeometry args={geo.backPanel} />
        <meshLambertMaterial
          color={EPOCH_A.busShelterGlass}
          transparent
          opacity={0.6}
          flatShading
        />
      </mesh>

      {/* Side panels */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={side}
          position={[side * (shelterWidth / 2 - panelThickness / 2), panelY, 0]}
        >
          <boxGeometry args={geo.sidePanel} />
          <meshLambertMaterial
            color={EPOCH_A.busShelterGlass}
            transparent
            opacity={0.6}
            flatShading
          />
        </mesh>
      ))}

      {/* Bus stop sign (round RATP sign on pole, beside shelter) */}
      <mesh position={[shelterWidth / 2 + 0.3, 1.6, 0]} castShadow>
        <cylinderGeometry args={geo.signPole} />
        <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
      </mesh>
      <mesh position={[shelterWidth / 2 + 0.3, 3.3, 0]}>
        <boxGeometry args={geo.sign} />
        <meshLambertMaterial color={EPOCH_A.busSign} flatShading />
      </mesh>
    </group>
  );
}
