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
import { ROAD_TILE, CROSSING_TILE, SIDEWALK_TILE } from '@/constants/kenneyRoads';
import type { KenneyRoadTileDef } from '@/constants/kenneyRoads';
import { computeRoadTiles, computeRoadSurfaceTiles } from '@/systems/roadTileSystem';
import type { TileInstance } from '@/systems/roadTileSystem';
import type { SceneRoad } from '@/types/osm';

interface OSMRoadsProps {
  roads: SceneRoad[];
}

const CROSSING_Y = 0.13;
const SIDEWALK_Y = 0.0;

// ─── Kenney tile InstancedMesh sub-component ────────────────────────

interface TileLayerProps {
  tileDef: KenneyRoadTileDef;
  instances: TileInstance[];
  y: number;
}

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

function TileLayer({ tileDef, instances, y }: TileLayerProps) {
  const { scene } = useGLTF(tileDef.path);
  const meshData = useMemo(() => extractMesh(scene), [scene]);
  const ref = useRef<InstancedMeshType>(null);

  useLayoutEffect(() => {
    if (!ref.current || instances.length === 0) return;
    const dummy = new Object3D();
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      dummy.position.set(inst.x, inst.y + y, inst.z);
      dummy.rotation.set(0, inst.rotationY + tileDef.rotationOffset, 0);
      // When tile is rotated 90°, swap X/Z scales so markings stay proportional
      const sx = tileDef.swapScale ? inst.scaleZ : inst.scaleX;
      const sz = tileDef.swapScale ? inst.scaleX : inst.scaleZ;
      dummy.scale.set(sx, 1, sz);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [instances, y]);

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

// ─── Main component ─────────────────────────────────────────────────

export default memo(function OSMRoads({ roads }: OSMRoadsProps) {
  const roadSurfaceTiles = useMemo(
    () => computeRoadSurfaceTiles(roads),
    [roads],
  );

  const { crossingTiles, sidewalkTiles } = useMemo(
    () => computeRoadTiles(roads),
    [roads],
  );

  return (
    <group>
      <TileLayer tileDef={ROAD_TILE} instances={roadSurfaceTiles} y={0} />
      <TileLayer tileDef={CROSSING_TILE} instances={crossingTiles} y={CROSSING_Y} />
      <TileLayer tileDef={SIDEWALK_TILE} instances={sidewalkTiles} y={SIDEWALK_Y} />
    </group>
  );
});
