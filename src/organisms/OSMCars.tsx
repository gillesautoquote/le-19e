import { useMemo, memo } from 'react';
import { hashString } from '@/utils/geoUtils';
import { KENNEY_CARS } from '@/constants/kenneyCars';
import CarVariantInstances from '@/atoms/CarVariantInstances';
import type { CarInstance } from '@/atoms/CarVariantInstances';
import type { SceneRoad } from '@/types/osm';

interface OSMCarsProps {
  roads: SceneRoad[];
}

/** Spacing between parked cars along the road (meters). */
const CAR_SPACING = 12;

/** Margin from road edge for parked car position (meters). */
const EDGE_MARGIN = 1.5;

/** Road types eligible for parked cars. */
const ELIGIBLE_TYPES: ReadonlySet<string> = new Set([
  'primary', 'secondary', 'tertiary', 'residential',
]);

export default memo(function OSMCars({ roads }: OSMCarsProps) {
  const grouped = useMemo(() => {
    const groups = new Map<string, CarInstance[]>();
    for (const def of KENNEY_CARS) groups.set(def.key, []);

    let globalIdx = 0;

    for (const road of roads) {
      if (!ELIGIBLE_TYPES.has(road.type)) continue;
      if (road.points.length < 2) continue;

      const parkOffset = road.width * 0.5 - EDGE_MARGIN;

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

        while (accumulated < segLen) {
          const t = accumulated / segLen;
          const cx = x1 + dx * t;
          const cz = z1 + dz * t;

          // Right side (always)
          const varR = hashString(road.id + globalIdx) % KENNEY_CARS.length;
          const defR = KENNEY_CARS[varR];
          groups.get(defR.key)!.push({
            x: cx - nx * parkOffset,
            z: cz - nz * parkOffset,
            rotationY: angle,
          });
          globalIdx++;

          // Left side (only for two-way roads)
          if (!road.oneway) {
            const varL = hashString(road.id + globalIdx) % KENNEY_CARS.length;
            const defL = KENNEY_CARS[varL];
            groups.get(defL.key)!.push({
              x: cx + nx * parkOffset,
              z: cz + nz * parkOffset,
              rotationY: angle + Math.PI,
            });
            globalIdx++;
          }

          accumulated += CAR_SPACING;
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
