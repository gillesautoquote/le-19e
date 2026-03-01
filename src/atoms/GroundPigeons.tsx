import { useMemo, memo } from 'react';
import { NPC } from '@/constants/npc';
import PigeonVisual from '@/atoms/PigeonVisual';

export default memo(function GroundPigeons() {
  const indices = useMemo(() => {
    const result: { gi: number; pi: number }[] = [];
    for (let gi = 0; gi < NPC.pigeonGroupCount; gi++) {
      for (let pi = 0; pi < NPC.pigeonPerGroup; pi++) {
        result.push({ gi, pi });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {indices.map(({ gi, pi }) => (
        <PigeonVisual
          key={`pg-${gi}-${pi}`}
          groupIndex={gi}
          pigeonIndex={pi}
        />
      ))}
    </group>
  );
});
