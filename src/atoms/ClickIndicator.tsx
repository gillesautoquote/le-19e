import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MeshBasicMaterial } from 'three';
import { EPOCH_A } from '@/constants/epochs';
import { CLICK_INDICATOR } from '@/constants/player';

interface ClickIndicatorProps {
  indicatorRef: React.RefObject<{ position: [number, number, number]; time: number } | null>;
}

export default function ClickIndicator({ indicatorRef }: ClickIndicatorProps) {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshBasicMaterial>(null);

  useFrame(() => {
    if (!meshRef.current || !matRef.current) return;

    const indicator = indicatorRef.current;
    if (!indicator) {
      meshRef.current.visible = false;
      return;
    }

    const elapsed = Date.now() - indicator.time;
    if (elapsed >= CLICK_INDICATOR.duration) {
      meshRef.current.visible = false;
      indicatorRef.current = null;
      return;
    }

    const t = elapsed / CLICK_INDICATOR.duration;
    meshRef.current.visible = true;
    meshRef.current.position.set(
      indicator.position[0],
      indicator.position[1],
      indicator.position[2]
    );
    matRef.current.opacity = CLICK_INDICATOR.initialOpacity * (1 - t);
    meshRef.current.scale.setScalar(1 + t * 0.5);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[CLICK_INDICATOR.innerRadius, CLICK_INDICATOR.outerRadius, CLICK_INDICATOR.segments]} />
      <meshBasicMaterial
        ref={matRef}
        color={EPOCH_A.clickIndicator}
        transparent
        opacity={CLICK_INDICATOR.initialOpacity}
      />
    </mesh>
  );
}
