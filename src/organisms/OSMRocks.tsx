import { useMemo, memo } from 'react';
import { useControls, folder } from 'leva';
import InstancedGLB from '@/molecules/InstancedGLB';
import { KAYKIT_ROCKS } from '@/constants/kaykitRocks';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { seededRandom } from '@/systems/npcRoutes';
import { pointInPolygon } from '@/utils/geometryTests';
import type { ScenePark, SceneWater } from '@/types/osm';
import type { InstanceTransform } from '@/molecules/InstancedGLB';

interface OSMRocksProps {
  parks: ScenePark[];
  waterways: SceneWater[];
}

const GOLDEN_ANGLE = 2.3998;

export default memo(function OSMRocks({ parks, waterways }: OSMRocksProps) {
  const controls = useControls('Rochers', {
    Parcs: folder({
      parkGrid: { value: 14, min: 4, max: 40, step: 1, label: 'Espacement' },
      parkJitter: { value: 5, min: 0, max: 15, step: 1, label: 'Jitter' },
    }),
    'Bords eau': folder({
      waterSpacing: { value: 10, min: 3, max: 30, step: 1, label: 'Espacement' },
      waterOffset: { value: 8, min: 1, max: 20, step: 1, label: 'Offset' },
    }),
  });

  const grouped = useMemo(() => {
    const groups = new Map<string, InstanceTransform[]>();
    for (const def of KAYKIT_ROCKS) groups.set(def.key, []);

    let seed = 9000;

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

      for (let gx = minX; gx <= maxX; gx += controls.parkGrid) {
        for (let gz = minZ; gz <= maxZ; gz += controls.parkGrid) {
          seed++;
          const jx = gx + (seededRandom(seed) - 0.5) * controls.parkJitter * 2;
          const jz = gz + (seededRandom(seed + 1000) - 0.5) * controls.parkJitter * 2;
          if (!pointInPolygon(jx, jz, park.polygon)) continue;

          const variantIdx = Math.abs(seed) % KAYKIT_ROCKS.length;
          const def = KAYKIT_ROCKS[variantIdx];
          const scale = (0.3 + seededRandom(seed + 2000) * 0.5) / def.nativeHeight;

          groups.get(def.key)!.push({
            x: jx, z: jz, y: getTerrainHeight(jx, jz), scale,
            rotationY: seed * GOLDEN_ANGLE,
          });
        }
      }
    }

    for (const ww of waterways) {
      if (ww.points.length < 2) continue;
      let dist = 0;
      for (let i = 1; i < ww.points.length; i++) {
        const [x0, z0] = ww.points[i - 1];
        const [x1, z1] = ww.points[i];
        const dx = x1 - x0;
        const dz = z1 - z0;
        const segLen = Math.sqrt(dx * dx + dz * dz);
        if (segLen < 0.1) continue;

        const nx = -dz / segLen;
        const nz = dx / segLen;

        while (dist < segLen) {
          seed++;
          const t = dist / segLen;
          const cx = x0 + dx * t;
          const cz = z0 + dz * t;
          const side = seededRandom(seed + 4000) > 0.5 ? 1 : -1;
          const off = (ww.width * 0.5 + controls.waterOffset) * side;
          const jitter = (seededRandom(seed + 5000) - 0.5) * 3;
          const rx = cx + nx * (off + jitter);
          const rz = cz + nz * (off + jitter);

          const variantIdx = Math.abs(seed) % KAYKIT_ROCKS.length;
          const def = KAYKIT_ROCKS[variantIdx];
          const scale = (0.2 + seededRandom(seed + 6000) * 0.4) / def.nativeHeight;

          groups.get(def.key)!.push({
            x: rx, z: rz, y: getTerrainHeight(rx, rz), scale,
            rotationY: seed * GOLDEN_ANGLE,
          });

          dist += controls.waterSpacing + seededRandom(seed + 7000) * 6;
        }
        dist -= segLen;
      }
    }

    return groups;
  }, [parks, waterways, controls.parkGrid, controls.parkJitter, controls.waterSpacing, controls.waterOffset]);

  return (
    <group>
      {KAYKIT_ROCKS.map((def) => {
        const instances = grouped.get(def.key);
        if (!instances || instances.length === 0) return null;
        return <InstancedGLB key={def.key} path={def.path} instances={instances} />;
      })}
    </group>
  );
});
