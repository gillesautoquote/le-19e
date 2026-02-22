import { useMemo, useLayoutEffect, useRef, memo } from 'react';
import {
  Object3D,
  Mesh,
  InstancedMesh as InstancedMeshType,
  BufferGeometry,
  Material,
  Group,
  Color,
  Float32BufferAttribute,
  DoubleSide,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { useGLTF } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { CROSSING_TILE, SIDEWALK_TILE } from '@/constants/kenneyRoads';
import type { KenneyRoadTileDef } from '@/constants/kenneyRoads';
import { computeRoadTiles } from '@/systems/roadTileSystem';
import type { TileInstance } from '@/systems/roadTileSystem';
import { roadToGeometry } from '@/systems/ribbonGeometry';
import type { SceneRoad } from '@/types/osm';

interface OSMRoadsProps {
  roads: SceneRoad[];
}

const VEHICLE_TYPES = new Set(['primary', 'secondary', 'tertiary', 'residential']);

const ROAD_COLORS: Record<string, string> = {
  primary: EPOCH_A.roadPrimary,
  secondary: EPOCH_A.roadSecondary,
  tertiary: EPOCH_A.roadTertiary,
  residential: EPOCH_A.roadResidential,
};

const CROSSING_Y = 0.03;
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
      dummy.rotation.set(0, inst.rotationY, 0);
      dummy.scale.set(inst.scaleX, 1, inst.scaleZ);
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
  const roadGeometry = useMemo(() => {
    const geos: BufferGeometry[] = [];

    for (const road of roads) {
      if (!VEHICLE_TYPES.has(road.type)) continue;
      if (road.points.length < 2) continue;

      const { geometry } = roadToGeometry(road);
      const hex = ROAD_COLORS[road.type] ?? EPOCH_A.roadResidential;
      const color = new Color(hex);

      const count = geometry.attributes.position.count;
      const colors = new Float32Array(count * 3);
      for (let j = 0; j < count * 3; j += 3) {
        colors[j] = color.r;
        colors[j + 1] = color.g;
        colors[j + 2] = color.b;
      }
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
      geos.push(geometry);
    }

    if (geos.length === 0) return null;
    return mergeGeometries(geos, false);
  }, [roads]);

  const { crossingTiles, sidewalkTiles } = useMemo(
    () => computeRoadTiles(roads),
    [roads],
  );

  return (
    <group>
      {roadGeometry && (
        <mesh geometry={roadGeometry} receiveShadow>
          <meshLambertMaterial
            vertexColors
            flatShading
            side={DoubleSide}
            polygonOffset
            polygonOffsetFactor={-3}
            polygonOffsetUnits={-3}
          />
        </mesh>
      )}
      <TileLayer tileDef={CROSSING_TILE} instances={crossingTiles} y={CROSSING_Y} />
      <TileLayer tileDef={SIDEWALK_TILE} instances={sidewalkTiles} y={SIDEWALK_Y} />
    </group>
  );
});
