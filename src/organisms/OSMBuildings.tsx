import { useMemo, memo } from 'react';
import { MeshLambertMaterial } from 'three';
import { Text, Billboard } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { BUILDING_LABEL } from '@/constants/world';
import { ALL_FACADE_MODULES } from '@/constants/kenneyModules';
import { computeFacadeTiling } from '@/systems/facadeTilingSystem';
import FacadeModuleInstances from '@/atoms/FacadeModuleInstances';
import type { SceneBuilding } from '@/types/osm';

interface OSMBuildingsProps {
  buildings: SceneBuilding[];
}

export default memo(function OSMBuildings({ buildings }: OSMBuildingsProps) {
  const { moduleInstances, roofGeometry, namedBuildings } = useMemo(
    () => computeFacadeTiling(buildings),
    [buildings],
  );

  const roofMat = useMemo(
    () => new MeshLambertMaterial({ vertexColors: true, flatShading: true }),
    [],
  );

  return (
    <>
      {ALL_FACADE_MODULES.map((def) => {
        const instances = moduleInstances.get(def.key);
        if (!instances?.length) return null;
        return (
          <FacadeModuleInstances key={def.key} moduleDef={def} instances={instances} />
        );
      })}

      {roofGeometry && (
        <mesh geometry={roofGeometry} material={roofMat} castShadow receiveShadow />
      )}

      {namedBuildings.map((label) => (
        <Billboard
          key={label.id}
          position={[label.cx, label.topY + BUILDING_LABEL.heightOffset, label.cz]}
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
            {label.name}
          </Text>
        </Billboard>
      ))}
    </>
  );
});
