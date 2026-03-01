import { useMemo, memo } from 'react';
import { useControls, folder } from 'leva';
import InstancedGLB from '@/molecules/InstancedGLB';
import { KAYKIT_FIRE_HYDRANTS, KAYKIT_DUMPSTERS } from '@/constants/kaykitUrban';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';
import { seededRandom } from '@/systems/npcRoutes';
import type { SceneRoad } from '@/types/osm';
import type { InstanceTransform } from '@/molecules/InstancedGLB';

interface OSMUrbanDetailsProps {
  roads: SceneRoad[];
}

const ELIGIBLE_TYPES = new Set(['residential', 'tertiary', 'secondary', 'primary']);

function sampleAlongRoads(
  roads: SceneRoad[],
  spacing: number,
  seedStart: number,
  skipRate: number,
  scale: number,
  sideOffset: number,
): InstanceTransform[] {
  const instances: InstanceTransform[] = [];
  let seed = seedStart;

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
        if (seededRandom(seed) > skipRate) {
          dist += spacing;
          continue;
        }

        const t = dist / segLen;
        const cx = x0 + dx * t;
        const cz = z0 + dz * t;
        const px = cx + nx * sideOffset;
        const pz = cz + nz * sideOffset;

        instances.push({
          x: px, z: pz,
          y: Math.max(getTerrainHeight(px, pz), getRoadGradeHeight(px, pz)),
          scale,
          rotationY: seededRandom(seed + 500) * Math.PI * 2,
        });

        dist += spacing;
      }
      dist -= segLen;
    }
  }

  return instances;
}

export default memo(function OSMUrbanDetails({ roads }: OSMUrbanDetailsProps) {
  const hydrantDef = KAYKIT_FIRE_HYDRANTS[0];
  const dumpsterDef = KAYKIT_DUMPSTERS[0];

  const controls = useControls('Mobilier urbain', {
    Bouches: folder({
      hydrantSpacing: { value: 120, min: 10, max: 300, step: 5, label: 'Espacement' },
      hydrantSkip: { value: 0.4, min: 0, max: 1, step: 0.05, label: 'Skip rate' },
      hydrantOffset: { value: 4.5, min: 1, max: 10, step: 0.5, label: 'Offset lat.' },
      hydrantScale: { value: hydrantDef.scale, min: 1, max: 10, step: 0.1, label: 'Scale' },
    }),
    Bennes: folder({
      dumpsterSpacing: { value: 180, min: 20, max: 400, step: 5, label: 'Espacement' },
      dumpsterSkip: { value: 0.3, min: 0, max: 1, step: 0.05, label: 'Skip rate' },
      dumpsterOffset: { value: 4.0, min: 1, max: 10, step: 0.5, label: 'Offset lat.' },
      dumpsterScale: { value: dumpsterDef.scale, min: 1, max: 10, step: 0.1, label: 'Scale' },
    }),
  });

  const hydrants = useMemo(() =>
    sampleAlongRoads(roads, controls.hydrantSpacing, 15000, controls.hydrantSkip, controls.hydrantScale, controls.hydrantOffset),
    [roads, controls.hydrantSpacing, controls.hydrantSkip, controls.hydrantScale, controls.hydrantOffset],
  );

  const dumpsters = useMemo(() =>
    sampleAlongRoads(roads, controls.dumpsterSpacing, 18000, controls.dumpsterSkip, controls.dumpsterScale, controls.dumpsterOffset),
    [roads, controls.dumpsterSpacing, controls.dumpsterSkip, controls.dumpsterScale, controls.dumpsterOffset],
  );

  return (
    <group>
      {hydrants.length > 0 && (
        <InstancedGLB path={hydrantDef.path} instances={hydrants} />
      )}
      {dumpsters.length > 0 && (
        <InstancedGLB path={dumpsterDef.path} instances={dumpsters} />
      )}
    </group>
  );
});
