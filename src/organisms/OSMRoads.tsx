import { useMemo, useLayoutEffect, useRef, memo } from 'react';
import {
  Object3D,
  Mesh,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Material,
  Group,
} from 'three';
import { useGLTF } from '@react-three/drei';
import {
  ROAD_STRAIGHT, ROAD_CROSSING, ROAD_CORNER,
  ROAD_TSPLIT, ROAD_JUNCTION, ROAD_SIDEWALK,
  ALL_ROAD_GRID_TILES,
} from '@/constants/kenneyRoads';
import type { KaykitRoadTileDef } from '@/constants/kenneyRoads';
import { computeRoadGrid, populateGridSurface } from '@/systems/roadGridSystem';
import type { GridTileInstance } from '@/systems/roadGridSystem';
import { getSurfaceGrid } from '@/systems/roadTileSystem';
import type { SceneRoad } from '@/types/osm';

interface OSMRoadsProps {
  roads: SceneRoad[];
}

// ─── Tile def lookup by key ──────────────────────────────────────

const TILE_DEFS: Record<string, KaykitRoadTileDef> = {
  [ROAD_STRAIGHT.key]: ROAD_STRAIGHT,
  [ROAD_CROSSING.key]: ROAD_CROSSING,
  [ROAD_CORNER.key]: ROAD_CORNER,
  [ROAD_TSPLIT.key]: ROAD_TSPLIT,
  [ROAD_JUNCTION.key]: ROAD_JUNCTION,
};

// ─── Mesh extraction helper ──────────────────────────────────────

function extractMesh(scene: Group): { geometry: BufferGeometry; material: Material } | null {
  let result: { geometry: BufferGeometry; material: Material } | null = null;
  scene.traverse((node: Object3D) => {
    if (!result && (node as Mesh).isMesh) {
      const mesh = node as Mesh;
      result = { geometry: mesh.geometry, material: mesh.material as Material };
    }
  });
  return result;
}

// ─── InstancedMesh layer (uniform scale) ─────────────────────────

interface GridTileLayerProps {
  tileDef: KaykitRoadTileDef;
  instances: GridTileInstance[];
}

function GridTileLayer({ tileDef, instances }: GridTileLayerProps) {
  const { scene } = useGLTF(tileDef.path);
  const meshData = useMemo(() => extractMesh(scene), [scene]);
  const ref = useRef<InstancedMeshType>(null);

  useLayoutEffect(() => {
    if (!ref.current || instances.length === 0) return;
    const dummy = new Object3D();
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      dummy.position.set(inst.x, inst.y, inst.z);
      dummy.rotation.set(0, inst.rotationY, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [instances]);

  if (!meshData || instances.length === 0) return null;

  return (
    <instancedMesh
      key={`${tileDef.key}-${instances.length}`}
      ref={ref}
      args={[meshData.geometry, meshData.material, instances.length]}
      receiveShadow
    />
  );
}

// ─── Main component ──────────────────────────────────────────────

export default memo(function OSMRoads({ roads }: OSMRoadsProps) {
  const gridResult = useMemo(() => {
    const result = computeRoadGrid(roads);
    populateGridSurface(result, getSurfaceGrid());
    return result;
  }, [roads]);

  return (
    <group>
      {ALL_ROAD_GRID_TILES.map((def) => {
        const group = TILE_DEFS[def.key];
        if (!group) {
          // Sidewalk
          if (def.key === ROAD_SIDEWALK.key && gridResult.sidewalks.length > 0) {
            return <GridTileLayer key={def.key} tileDef={def} instances={gridResult.sidewalks} />;
          }
          return null;
        }
        const instances = gridResult.tileGroups.get(def.key);
        if (!instances || instances.length === 0) return null;
        return <GridTileLayer key={def.key} tileDef={def} instances={instances} />;
      })}
    </group>
  );
});
