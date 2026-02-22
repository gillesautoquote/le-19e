import { useMemo } from 'react';
import { EPOCH_A } from '@/constants/epochs';

interface TrafficLightProps {
  position: [number, number, number];
}

/**
 * Traffic light: pole + housing with 3 lights (red, amber, green).
 */
export function TrafficLight({ position }: TrafficLightProps) {
  const geo = useMemo(() => ({
    pole: [0.04, 0.04, 3.0, 6] as [number, number, number, number],
    housing: [0.18, 0.55, 0.12] as [number, number, number],
    light: [0.05, 8] as [number, number],
  }), []);

  const poleY = 1.5;
  const housingY = 3.1;
  const lightColors = [
    { color: EPOCH_A.trafficLightRed, y: housingY + 0.18 },
    { color: EPOCH_A.trafficLightAmber, y: housingY },
    { color: EPOCH_A.trafficLightGreen, y: housingY - 0.18 },
  ];

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, poleY, 0]} castShadow>
        <cylinderGeometry args={geo.pole} />
        <meshLambertMaterial color={EPOCH_A.trafficLightPole} flatShading />
      </mesh>

      {/* Housing */}
      <mesh position={[0, housingY, 0.07]} castShadow>
        <boxGeometry args={geo.housing} />
        <meshLambertMaterial color={EPOCH_A.trafficLightPole} flatShading />
      </mesh>

      {/* Lights */}
      {lightColors.map(({ color, y }) => (
        <mesh key={color} position={[0, y, 0.14]}>
          <circleGeometry args={geo.light} />
          <meshLambertMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}
