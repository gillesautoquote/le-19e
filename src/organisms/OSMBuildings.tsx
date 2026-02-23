import { useMemo, memo } from 'react';
import { MeshLambertMaterial } from 'three';
import { Text, Billboard } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { BUILDING_LABEL } from '@/constants/world';
import { buildMergedBuildings } from '@/systems/buildingGeometry';
import { createFacadeTexture } from '@/utils/facadeTexture';
import type { SceneBuilding } from '@/types/osm';

interface OSMBuildingsProps {
  buildings: SceneBuilding[];
}

export default memo(function OSMBuildings({ buildings }: OSMBuildingsProps) {
  // Facade texture (created once, cached in facadeTexture module)
  const facade = useMemo(() => createFacadeTexture(), []);

  // Build merged wall + roof geometries from all buildings
  const { walls, roofs, namedBuildings } = useMemo(
    () => buildMergedBuildings(buildings, facade.tileWidth, facade.floorHeight),
    [buildings, facade.tileWidth, facade.floorHeight],
  );

  // Materials (stable references via useMemo)
  const wallMat = useMemo(
    () => new MeshLambertMaterial({
      map: facade.texture,
      vertexColors: true,
      flatShading: true,
    }),
    [facade.texture],
  );

  const roofMat = useMemo(
    () => new MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
    }),
    [],
  );

  return (
    <>
      {walls && (
        <mesh geometry={walls} material={wallMat} castShadow receiveShadow />
      )}
      {roofs && (
        <mesh geometry={roofs} material={roofMat} castShadow receiveShadow />
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
