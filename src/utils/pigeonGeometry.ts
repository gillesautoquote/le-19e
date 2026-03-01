import { BufferGeometry, Float32BufferAttribute } from 'three';

/** Create a pigeon wing geometry (quad shape, 2 triangles). */
export function createPigeonWing(mirror: boolean): BufferGeometry {
  const s = mirror ? 1 : -1;
  const geo = new BufferGeometry();
  const vertices = new Float32Array([
    0, 0, 0.1,
    s * 0.26, 0.04, 0.03,
    0, 0, -0.08,
    0, 0, -0.08,
    s * 0.26, 0.04, 0.03,
    s * 0.2, 0.03, -0.07,
  ]);
  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Create a pigeon tail geometry (fan, 2 triangles). */
export function createPigeonTail(): BufferGeometry {
  const geo = new BufferGeometry();
  const vertices = new Float32Array([
    0, 0, 0,
    -0.065, 0.015, -0.1,
    0, 0.008, -0.12,
    0, 0, 0,
    0, 0.008, -0.12,
    0.065, 0.015, -0.1,
  ]);
  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}
