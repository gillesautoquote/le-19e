import { useMemo, memo } from 'react';
import { useControls } from 'leva';
import InstancedGLB from '@/molecules/InstancedGLB';
import { KAYKIT_GRASS } from '@/constants/kaykitForest';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { seededRandom } from '@/systems/npcRoutes';
import { pointInPolygon } from '@/utils/geometryTests';
import type { ScenePark } from '@/types/osm';
import type { InstanceTransform } from '@/molecules/InstancedGLB';

interface GrassPatchesProps {
  parks: ScenePark[];
}

const GOLDEN_ANGLE = 2.3998;

export default memo(function GrassPatches({ parks }: GrassPatchesProps) {
  const { gridStep, jitter, scaleMul } = useControls('Herbe', {
    gridStep: { value: 3.5, min: 1, max: 10, step: 0.5, label: 'Espacement' },
    jitter: { value: 1.2, min: 0, max: 5, step: 0.1, label: 'Jitter' },
    scaleMul: { value: 1, min: 0.2, max: 3, step: 0.1, label: 'Scale mult.' },
  });

  const grouped = useMemo(() => {
    const groups = new Map<string, InstanceTransform[]>();
    for (const def of KAYKIT_GRASS) groups.set(def.key, []);

    let seedCounter = 7000;

    for (const park of parks) {
      if (park.polygon.length < 3) continue;

      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const [px, pz] of park.polygon) {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (pz < minZ) minZ = pz;
        if (pz > maxZ) maxZ = pz;
      }

      for (let gx = minX; gx <= maxX; gx += gridStep) {
        for (let gz = minZ; gz <= maxZ; gz += gridStep) {
          seedCounter++;
          const jx = gx + (seededRandom(seedCounter) - 0.5) * jitter * 2;
          const jz = gz + (seededRandom(seedCounter + 3000) - 0.5) * jitter * 2;

          if (!pointInPolygon(jx, jz, park.polygon)) continue;

          const variantIdx = Math.abs(seedCounter) % KAYKIT_GRASS.length;
          const def = KAYKIT_GRASS[variantIdx];
          const scale = ((0.3 + seededRandom(seedCounter + 6000) * 0.4) / def.nativeHeight) * scaleMul;

          groups.get(def.key)!.push({
            x: jx, z: jz, y: getTerrainHeight(jx, jz), scale,
            rotationY: seedCounter * GOLDEN_ANGLE,
          });
        }
      }
    }

    return groups;
  }, [parks, gridStep, jitter, scaleMul]);

  return (
    <group>
      {KAYKIT_GRASS.map((def) => {
        const instances = grouped.get(def.key);
        if (!instances || instances.length === 0) return null;
        return (
          <InstancedGLB key={def.key} path={def.path} instances={instances} castShadow={false} />
        );
      })}
    </group>
  );
});
