import { useMemo, memo } from 'react';
import { useControls } from 'leva';
import InstancedGLB from '@/molecules/InstancedGLB';
import { KAYKIT_BUSHES } from '@/constants/kaykitForest';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { seededRandom } from '@/systems/npcRoutes';
import { pointInPolygon } from '@/utils/geometryTests';
import type { ScenePark } from '@/types/osm';
import type { InstanceTransform } from '@/molecules/InstancedGLB';

interface OSMBushesProps {
  parks: ScenePark[];
}

const GOLDEN_ANGLE = 2.3998;

export default memo(function OSMBushes({ parks }: OSMBushesProps) {
  const { gridStep, jitter, scaleMul } = useControls('Buissons', {
    gridStep: { value: 6, min: 2, max: 20, step: 0.5, label: 'Espacement' },
    jitter: { value: 2, min: 0, max: 8, step: 0.5, label: 'Jitter' },
    scaleMul: { value: 0.8, min: 0.2, max: 2, step: 0.05, label: 'Scale mult.' },
  });

  const grouped = useMemo(() => {
    const groups = new Map<string, InstanceTransform[]>();
    for (const def of KAYKIT_BUSHES) groups.set(def.key, []);

    let seedCounter = 0;

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
          const jz = gz + (seededRandom(seedCounter + 1000) - 0.5) * jitter * 2;

          if (!pointInPolygon(jx, jz, park.polygon)) continue;

          const variantIdx = Math.abs(seedCounter) % KAYKIT_BUSHES.length;
          const def = KAYKIT_BUSHES[variantIdx];
          const scale = (2.0 + seededRandom(seedCounter + 2000) * 2.0) / def.nativeHeight * scaleMul;

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
      {KAYKIT_BUSHES.map((def) => {
        const instances = grouped.get(def.key);
        if (!instances || instances.length === 0) return null;
        return <InstancedGLB key={def.key} path={def.path} instances={instances} />;
      })}
    </group>
  );
});
