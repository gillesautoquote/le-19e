import { useMemo, memo } from 'react';
import { Shape, ShapeGeometry, Float32BufferAttribute, Color, DoubleSide } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EPOCH_A } from '@/constants/epochs';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { ScenePark } from '@/types/osm';

interface OSMParksProps {
  parks: ScenePark[];
}

const PARK_Y = 0.01;

export default memo(function OSMParks({ parks }: OSMParksProps) {
  const geometry = useMemo(() => {
    if (parks.length === 0) return null;

    const geos: ShapeGeometry[] = [];
    const parkColor = new Color(EPOCH_A.vegetation);

    for (const park of parks) {
      if (park.polygon.length < 3) continue;

      // Negate Z for correct world position, reverse traversal to preserve winding.
      const shape = new Shape();
      const pts = park.polygon;
      const last = pts.length - 1;
      shape.moveTo(pts[last][0], -pts[last][1]);
      for (let i = last - 1; i >= 0; i--) {
        shape.lineTo(pts[i][0], -pts[i][1]);
      }
      shape.closePath();

      const geo = new ShapeGeometry(shape);
      // Rotate flat on XZ plane
      geo.rotateX(-Math.PI / 2);

      // Displace each vertex Y to follow terrain
      const posAttr = geo.attributes.position;
      for (let v = 0; v < posAttr.count; v++) {
        const vx = posAttr.getX(v);
        const vz = posAttr.getZ(v);
        posAttr.setY(v, getTerrainHeight(vx, vz) + PARK_Y);
      }

      // Apply vertex colors
      const count = geo.attributes.position.count;
      const colors = new Float32Array(count * 3);
      for (let j = 0; j < count * 3; j += 3) {
        colors[j] = parkColor.r;
        colors[j + 1] = parkColor.g;
        colors[j + 2] = parkColor.b;
      }
      geo.setAttribute('color', new Float32BufferAttribute(colors, 3));

      geos.push(geo);
    }

    if (geos.length === 0) return null;
    return mergeGeometries(geos, false);
  }, [parks]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors flatShading side={DoubleSide} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
  );
});
