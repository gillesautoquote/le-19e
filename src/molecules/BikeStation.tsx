import { useMemo } from 'react';
import { Velib } from '@/atoms/Velib';
import { EPOCH_A } from '@/constants/epochs';

interface BikeStationProps {
  position: [number, number, number];
  capacity: number;
  name: string;
  stationId: string;
}

/**
 * Vélib' bike station: a row of docks with bikes, a terminal, and a sign.
 * Shows ~60% occupancy by default.
 */
export function BikeStation({ position, capacity, name, stationId }: BikeStationProps) {
  const bikeCount = useMemo(() => Math.max(1, Math.floor(capacity * 0.6)), [capacity]);
  const stationWidth = useMemo(() => Math.min(capacity * 0.7, 12), [capacity]);

  // Suppress unused var — available for Html label in future
  void name;
  void stationId;

  const geo = useMemo(() => ({
    terminal: [0.4, 1.2, 0.3] as [number, number, number],
    terminalScreen: [0.3, 0.25, 0.02] as [number, number, number],
    dockRail: [stationWidth, 0.06, 0.06] as [number, number, number],
  }), [stationWidth]);

  return (
    <group position={position}>
      {/* Dock rail (ground-level bar where bikes lock in) */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={geo.dockRail} />
        <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
      </mesh>

      {/* Bikes */}
      <Velib position={[0, 0, 0]} count={bikeCount} />

      {/* Payment terminal */}
      <mesh position={[stationWidth / 2 + 0.5, 0.6, 0]} castShadow>
        <boxGeometry args={geo.terminal} />
        <meshLambertMaterial color={EPOCH_A.velibStation} flatShading />
      </mesh>
      <mesh position={[stationWidth / 2 + 0.5, 0.85, 0.16]}>
        <boxGeometry args={geo.terminalScreen} />
        <meshLambertMaterial color={EPOCH_A.busShelterGlass} flatShading />
      </mesh>
    </group>
  );
}
