import { useMemo, memo } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { BUILDING_LABEL } from '@/constants/world';
import { ALL_KENNEY_BUILDINGS } from '@/constants/kenneyBuildings';
import BuildingVariantInstances from '@/atoms/BuildingVariantInstances';
import type { BuildingInstance } from '@/atoms/BuildingVariantInstances';
import {
  polygonCentroid,
  polygonPrincipalAngle,
  orientedBBoxSize,
  polygonFillRatio,
  selectBuildingModel,
} from '@/utils/buildingUtils';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { SceneBuilding } from '@/types/osm';

interface OSMBuildingsProps {
  buildings: SceneBuilding[];
}

// Minimum scale to avoid degenerate geometry
const MIN_SCALE = 0.5;

// Global margin: shrink XZ by 15% so buildings don't overflow onto roads
const BUILDING_MARGIN = 0.85;

export default memo(function OSMBuildings({ buildings }: OSMBuildingsProps) {
  // Compute per-building instance data
  const instanceData = useMemo(() => {
    const instances: BuildingInstance[] = [];

    for (const building of buildings) {
      if (building.polygon.length < 3) continue;

      const [cx, cz] = polygonCentroid(building.polygon);
      const angle = polygonPrincipalAngle(building.polygon);
      const [obbWidth, obbDepth] = orientedBBoxSize(building.polygon, angle);
      const model = selectBuildingModel(building.id, building.type);

      const fill = polygonFillRatio(building.polygon, obbWidth, obbDepth);
      const margin = fill * BUILDING_MARGIN;
      const scaleX = Math.max(MIN_SCALE, (obbWidth * margin) / model.nativeWidth);
      const scaleY = Math.max(MIN_SCALE, building.height / model.nativeHeight);
      const scaleZ = Math.max(MIN_SCALE, (obbDepth * margin) / model.nativeDepth);

      instances.push({
        building,
        modelKey: model.key,
        cx,
        cz,
        angle,
        scaleX,
        scaleY,
        scaleZ,
      });
    }

    return instances;
  }, [buildings]);

  // Group instances by model key
  const groupedByModel = useMemo(() => {
    const groups = new Map<string, BuildingInstance[]>();
    for (const inst of instanceData) {
      const arr = groups.get(inst.modelKey) ?? [];
      arr.push(inst);
      groups.set(inst.modelKey, arr);
    }
    return groups;
  }, [instanceData]);

  // Named buildings for labels
  const namedBuildings = useMemo(
    () => instanceData.filter((inst) => inst.building.name),
    [instanceData],
  );

  return (
    <>
      {ALL_KENNEY_BUILDINGS.map((def) => {
        const instances = groupedByModel.get(def.key);
        if (!instances || instances.length === 0) return null;
        return (
          <BuildingVariantInstances
            key={def.key}
            modelDef={def}
            instances={instances}
          />
        );
      })}

      {namedBuildings.map((inst) => (
        <Billboard
          key={inst.building.id}
          position={[inst.cx, getTerrainHeight(inst.cx, inst.cz) + inst.building.height + BUILDING_LABEL.heightOffset, inst.cz]}
          follow
        >
          <Text
            fontSize={1.5}
            color={EPOCH_A.labelText}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.08}
            outlineColor={EPOCH_A.labelOutline}
            maxWidth={20}
          >
            {inst.building.name}
          </Text>
        </Billboard>
      ))}
    </>
  );
});
