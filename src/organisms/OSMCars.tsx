import { useMemo, memo } from 'react';
import { hashString } from '@/utils/geoUtils';
import { KENNEY_CARS } from '@/constants/kenneyCars';
import CarVariantInstances from '@/atoms/CarVariantInstances';
import type { CarInstance } from '@/atoms/CarVariantInstances';
import type { SceneRoad } from '@/types/osm';

interface OSMCarsProps {
  roads: SceneRoad[];
}

const CAR_SPACING = 30;
const ELIGIBLE_TYPES: ReadonlySet<string> = new Set(['primary', 'secondary']);

export default memo(function OSMCars({ roads }: OSMCarsProps) {
  const grouped = useMemo(() => {
    const groups = new Map<string, CarInstance[]>();
    for (const def of KENNEY_CARS) groups.set(def.key, []);

    let globalIdx = 0;

    for (const road of roads) {
      if (!ELIGIBLE_TYPES.has(road.type)) continue;
      if (road.points.length < 2) continue;

      // Walk along polyline, placing cars at regular intervals
      let accumulated = 0;
      for (let i = 0; i < road.points.length - 1; i++) {
        const [x1, z1] = road.points[i];
        const [x2, z2] = road.points[i + 1];
        const dx = x2 - x1;
        const dz = z2 - z1;
        const segLen = Math.sqrt(dx * dx + dz * dz);
        if (segLen < 0.1) continue;

        const angle = Math.atan2(dx, dz);
        const nx = -dz / segLen;
        const nz = dx / segLen;
        const offset = road.width * 0.25;

        while (accumulated < segLen) {
          const t = accumulated / segLen;
          const px = x1 + dx * t + nx * offset;
          const pz = z1 + dz * t + nz * offset;

          const variantIdx = hashString(road.id + globalIdx) % KENNEY_CARS.length;
          const def = KENNEY_CARS[variantIdx];
          groups.get(def.key)!.push({ x: px, z: pz, rotationY: angle });

          accumulated += CAR_SPACING;
          globalIdx++;
        }
        accumulated -= segLen;
      }
    }

    return groups;
  }, [roads]);

  return (
    <group>
      {KENNEY_CARS.map((def) => {
        const instances = grouped.get(def.key);
        if (!instances || instances.length === 0) return null;
        return (
          <CarVariantInstances key={def.key} modelDef={def} instances={instances} />
        );
      })}
    </group>
  );
});
