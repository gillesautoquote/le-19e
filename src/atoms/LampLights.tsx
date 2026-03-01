import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointLight, Vector3 } from 'three';
import { EPOCH_A, EPOCH_B } from '@/constants/epochs';
import { LAMP_LIGHTS } from '@/constants/world';
import { useWorldStore } from '@/store/worldStore';
import { usePlayerStore } from '@/store/playerStore';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';
import type { SceneLamp } from '@/types/osm';

interface LampLightsProps {
  lamps: SceneLamp[];
}

const tmpVec = new Vector3();

export default memo(function LampLights({ lamps }: LampLightsProps) {
  const lightsRef = useRef<(PointLight | null)[]>([]);
  const frameCount = useRef(0);

  // Pre-compute lamp light positions (top of each lamp)
  const lampPositions = useMemo(() =>
    lamps.map((l) => {
      const [x, z] = l.position;
      const groundY = Math.max(getTerrainHeight(x, z), getRoadGradeHeight(x, z));
      return new Vector3(x, groundY + LAMP_LIGHTS.lightHeight, z);
    }),
    [lamps],
  );

  // Reposition pool lights to N closest lamps (throttled)
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % LAMP_LIGHTS.updateInterval !== 0) return;
    if (lampPositions.length === 0) return;

    const [px, py, pz] = usePlayerStore.getState().position;
    const epoch = useWorldStore.getState().epoch;
    const palette = epoch === 'A' ? EPOCH_A : EPOCH_B;

    tmpVec.set(px, py, pz);

    // Find N closest lamps by squared distance
    const ranked = lampPositions
      .map((pos, idx) => ({ idx, distSq: tmpVec.distanceToSquared(pos) }))
      .sort((a, b) => a.distSq - b.distSq);

    for (let i = 0; i < LAMP_LIGHTS.poolSize; i++) {
      const light = lightsRef.current[i];
      if (!light) continue;

      if (i < ranked.length) {
        const lampPos = lampPositions[ranked[i].idx];
        light.position.copy(lampPos);
        light.color.set(palette.lampHead);
        light.visible = true;
      } else {
        light.visible = false;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: LAMP_LIGHTS.poolSize }, (_, i) => (
        <pointLight
          key={i}
          ref={(el) => { lightsRef.current[i] = el; }}
          intensity={LAMP_LIGHTS.intensity}
          distance={LAMP_LIGHTS.distance}
          decay={LAMP_LIGHTS.decay}
        />
      ))}
    </group>
  );
});
