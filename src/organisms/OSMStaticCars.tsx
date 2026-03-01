import { useMemo, memo } from 'react';
import { useControls } from 'leva';
import InstancedGLB from '@/molecules/InstancedGLB';
import { KAYKIT_STATIC_CARS } from '@/constants/kaykitCars';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadSurfaceHeight } from '@/systems/roadTileSystem';
import { seededRandom } from '@/systems/npcRoutes';
import type { SceneRoad } from '@/types/osm';
import type { InstanceTransform } from '@/molecules/InstancedGLB';

interface OSMStaticCarsProps {
  roads: SceneRoad[];
}

const ELIGIBLE_TYPES = new Set(['residential', 'tertiary', 'secondary']);

export default memo(function OSMStaticCars({ roads }: OSMStaticCarsProps) {
  const { spacing, skipThreshold, laneOffset, yOffset } = useControls('Voitures', {
    spacing: { value: 45, min: 5, max: 120, step: 1 },
    skipThreshold: { value: 0.5, min: 0, max: 1, step: 0.05 },
    laneOffset: { value: 0.45, min: 0.1, max: 1, step: 0.05 },
    yOffset: { value: 0.05, min: -0.5, max: 1, step: 0.01 },
  });

  const grouped = useMemo(() => {
    const groups = new Map<string, InstanceTransform[]>();
    for (const def of KAYKIT_STATIC_CARS) groups.set(def.key, []);

    let seed = 12000;

    for (const road of roads) {
      if (!ELIGIBLE_TYPES.has(road.type)) continue;
      if (road.points.length < 2) continue;

      let dist = 0;
      for (let i = 1; i < road.points.length; i++) {
        const [x0, z0] = road.points[i - 1];
        const [x1, z1] = road.points[i];
        const dx = x1 - x0;
        const dz = z1 - z0;
        const segLen = Math.sqrt(dx * dx + dz * dz);
        if (segLen < 0.1) continue;

        const nx = -dz / segLen;
        const nz = dx / segLen;

        while (dist < segLen) {
          seed++;
          if (seededRandom(seed) > skipThreshold) {
            dist += spacing;
            continue;
          }

          const t = dist / segLen;
          const cx = x0 + dx * t;
          const cz = z0 + dz * t;
          const lo = road.width * laneOffset;
          const px = cx + nx * lo;
          const pz = cz + nz * lo;
          const angle = Math.atan2(dx, dz);

          const variantIdx = Math.abs(seed) % KAYKIT_STATIC_CARS.length;
          const def = KAYKIT_STATIC_CARS[variantIdx];

          groups.get(def.key)!.push({
            x: px, z: pz,
            y: Math.max(getTerrainHeight(px, pz), getRoadSurfaceHeight(px, pz)) + yOffset,
            scale: def.scale,
            rotationY: angle,
          });

          dist += spacing;
        }
        dist -= segLen;
      }
    }

    return groups;
  }, [roads, spacing, skipThreshold, laneOffset, yOffset]);

  return (
    <group>
      {KAYKIT_STATIC_CARS.map((def) => {
        const instances = grouped.get(def.key);
        if (!instances || instances.length === 0) return null;
        return <InstancedGLB key={def.key} path={def.path} instances={instances} />;
      })}
    </group>
  );
});
