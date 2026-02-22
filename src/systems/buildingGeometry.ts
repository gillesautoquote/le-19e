import { ExtrudeGeometry, Shape } from 'three';
import type { SceneBuilding } from '@/types/osm';

// ─── Building geometry ───────────────────────────────────────────

export interface BuildingGeometryResult {
  geometry: ExtrudeGeometry;
  height: number;
  color: string;
  id: string;
  centroid: [number, number];
}

/**
 * Create an ExtrudeGeometry for a building from its scene-space polygon.
 * The geometry is extruded upward (Y axis) by the building height.
 */
export function buildingToGeometry(building: SceneBuilding): BuildingGeometryResult {
  const shape = new Shape();
  const points = building.polygon;

  if (points.length < 3) {
    shape.moveTo(0, 0);
    shape.lineTo(1, 0);
    shape.lineTo(1, 1);
  } else {
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1]);
    }
  }

  const geometry = new ExtrudeGeometry(shape, {
    depth: building.height,
    bevelEnabled: false,
  });

  // ExtrudeGeometry extrudes along Z by default. We need to rotate
  // so the extrusion goes along Y (up). We do this by swapping Y/Z
  // in the position attribute.
  const posAttr = geometry.getAttribute('position');
  const positions = posAttr.array as Float32Array;
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const z = positions[i + 2];
    positions[i + 1] = z; // depth becomes height (Y)
    positions[i + 2] = y; // original Y becomes Z
  }
  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();

  // Compute centroid for positioning reference
  let cx = 0;
  let cz = 0;
  for (const [x, z] of points) {
    cx += x;
    cz += z;
  }
  cx /= points.length;
  cz /= points.length;

  return {
    geometry,
    height: building.height,
    color: building.color,
    id: building.id,
    centroid: [cx, cz],
  };
}
