import { useMemo, memo } from 'react';
import {
  BoxGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Color,
  Matrix4,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EPOCH_A } from '@/constants/epochs';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { SceneBench, SceneLamp } from '@/types/osm';

interface OSMFurnitureProps {
  benches: SceneBench[];
  lamps: SceneLamp[];
}

function applyVertexColor(geo: BoxGeometry | CylinderGeometry, color: Color) {
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
}

export default memo(function OSMFurniture({ benches, lamps }: OSMFurnitureProps) {
  const geometry = useMemo(() => {
    if (benches.length === 0 && lamps.length === 0) return null;

    const geos: (BoxGeometry | CylinderGeometry)[] = [];
    const woodColor = new Color(EPOCH_A.benchWood);
    const metalColor = new Color(EPOCH_A.benchMetal);
    const poleColor = new Color(EPOCH_A.lampPost);
    const lampColor = new Color(EPOCH_A.lampHead);

    // Benches — each as 2 merged boxes (seat + backrest)
    for (const b of benches) {
      const ty = getTerrainHeight(b.position[0], b.position[1]);
      const m = new Matrix4().makeRotationY(b.orientation);
      m.setPosition(b.position[0], ty, b.position[1]);

      const seat = new BoxGeometry(1.5, 0.08, 0.5);
      seat.translate(0, 0.45, 0);
      seat.applyMatrix4(m);
      applyVertexColor(seat, woodColor);
      geos.push(seat);

      const back = new BoxGeometry(1.5, 0.5, 0.05);
      back.translate(0, 0.75, -0.2);
      back.applyMatrix4(m);
      applyVertexColor(back, woodColor);
      geos.push(back);

      const legL = new BoxGeometry(0.08, 0.45, 0.4);
      legL.translate(-0.6, 0.22, 0);
      legL.applyMatrix4(m);
      applyVertexColor(legL, metalColor);
      geos.push(legL);

      const legR = new BoxGeometry(0.08, 0.45, 0.4);
      legR.translate(0.6, 0.22, 0);
      legR.applyMatrix4(m);
      applyVertexColor(legR, metalColor);
      geos.push(legR);
    }

    // Lamps — pole + head
    for (const l of lamps) {
      const x = l.position[0];
      const z = l.position[1];
      const ly = getTerrainHeight(x, z);

      const pole = new CylinderGeometry(0.06, 0.08, 4, 6);
      pole.translate(x, ly + 2.1, z);
      applyVertexColor(pole, poleColor);
      geos.push(pole);

      const head = new BoxGeometry(0.35, 0.25, 0.35);
      head.translate(x + 0.5, ly + 4.15, z);
      applyVertexColor(head, lampColor);
      geos.push(head);
    }

    if (geos.length === 0) return null;
    return mergeGeometries(geos, false);
  }, [benches, lamps]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  );
});
