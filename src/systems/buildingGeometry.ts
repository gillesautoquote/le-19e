import {
  BufferGeometry,
  Float32BufferAttribute,
  Shape,
  ShapeGeometry,
  Color,
} from 'three';
import type { SceneBuilding } from '@/types/osm';
import { getTerrainHeight } from '@/systems/terrainSystem';

// ─── Types ──────────────────────────────────────────────────────

export interface NamedBuildingLabel {
  id: string;
  name: string;
  cx: number;
  cz: number;
  topY: number;
}

export interface MergedBuildingGeometry {
  walls: BufferGeometry | null;
  roofs: BufferGeometry | null;
  namedBuildings: NamedBuildingLabel[];
}

// ─── Main builder ───────────────────────────────────────────────

export function buildMergedBuildings(
  buildings: SceneBuilding[],
  tileWidth: number,
  floorHeight: number,
): MergedBuildingGeometry {
  // Accumulators for wall geometry (non-indexed, position/normal/uv/color)
  const wPos: number[] = [];
  const wNor: number[] = [];
  const wUv: number[] = [];
  const wCol: number[] = [];

  // Accumulators for roof geometry
  const rPos: number[] = [];
  const rNor: number[] = [];
  const rCol: number[] = [];

  const labels: NamedBuildingLabel[] = [];
  const tmpColor = new Color();

  for (const b of buildings) {
    const poly = b.polygon;
    if (poly.length < 3) continue;

    // Centroid for terrain height lookup
    let cx = 0;
    let cz = 0;
    for (const [x, z] of poly) { cx += x; cz += z; }
    cx /= poly.length;
    cz /= poly.length;

    const terrainY = getTerrainHeight(cx, cz);
    const baseY = terrainY;
    const topY = terrainY + b.height;

    tmpColor.set(b.color);
    const cr = tmpColor.r;
    const cg = tmpColor.g;
    const cb = tmpColor.b;

    // ── Walls ─────────────────────────────────────────────
    buildWalls(poly, baseY, topY, tileWidth, floorHeight, cr, cg, cb, wPos, wNor, wUv, wCol);

    // ── Roof ──────────────────────────────────────────────
    buildRoof(poly, topY, cr, cg, cb, rPos, rNor, rCol);

    // ── Label ─────────────────────────────────────────────
    if (b.name) {
      labels.push({ id: b.id, name: b.name, cx, cz, topY });
    }
  }

  return {
    walls: wPos.length > 0 ? makeBufferGeo(wPos, wNor, wCol, wUv) : null,
    roofs: rPos.length > 0 ? makeBufferGeo(rPos, rNor, rCol) : null,
    namedBuildings: labels,
  };
}

// ─── Wall construction ──────────────────────────────────────────

function buildWalls(
  poly: [number, number][],
  baseY: number,
  topY: number,
  tileW: number,
  floorH: number,
  cr: number,
  cg: number,
  cb: number,
  pos: number[],
  nor: number[],
  uv: number[],
  col: number[],
): void {
  const height = topY - baseY;
  const vTop = height / floorH;
  let perimDist = 0;

  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    const x0 = poly[i][0], z0 = poly[i][1];
    const x1 = poly[j][0], z1 = poly[j][1];

    const dx = x1 - x0;
    const dz = z1 - z0;
    const edgeLen = Math.sqrt(dx * dx + dz * dz);
    if (edgeLen < 0.01) continue;

    // Outward normal (assumes CCW winding viewed from above)
    const nx = -dz / edgeLen;
    const nz = dx / edgeLen;

    const u0 = perimDist / tileW;
    const u1 = (perimDist + edgeLen) / tileW;

    // Quad: 2 triangles (CCW front-facing)
    // Triangle 1: bottom-left, bottom-right, top-right
    pushVertex(pos, nor, uv, col, x0, baseY, z0, nx, 0, nz, u0, 0, cr, cg, cb);
    pushVertex(pos, nor, uv, col, x1, baseY, z1, nx, 0, nz, u1, 0, cr, cg, cb);
    pushVertex(pos, nor, uv, col, x1, topY, z1, nx, 0, nz, u1, vTop, cr, cg, cb);

    // Triangle 2: bottom-left, top-right, top-left
    pushVertex(pos, nor, uv, col, x0, baseY, z0, nx, 0, nz, u0, 0, cr, cg, cb);
    pushVertex(pos, nor, uv, col, x1, topY, z1, nx, 0, nz, u1, vTop, cr, cg, cb);
    pushVertex(pos, nor, uv, col, x0, topY, z0, nx, 0, nz, u0, vTop, cr, cg, cb);

    perimDist += edgeLen;
  }
}

function pushVertex(
  pos: number[], nor: number[], uv: number[], col: number[],
  px: number, py: number, pz: number,
  nx: number, ny: number, nz: number,
  u: number, v: number,
  cr: number, cg: number, cb: number,
): void {
  pos.push(px, py, pz);
  nor.push(nx, ny, nz);
  uv.push(u, v);
  col.push(cr, cg, cb);
}

// ─── Roof construction ──────────────────────────────────────────

function buildRoof(
  poly: [number, number][],
  roofY: number,
  cr: number,
  cg: number,
  cb: number,
  pos: number[],
  nor: number[],
  col: number[],
): void {
  // Use ShapeGeometry for triangulation (same approach as OSMParks)
  const shape = new Shape();
  const last = poly.length - 1;
  // Reversed traversal + negate Z for correct winding after rotateX
  shape.moveTo(poly[last][0], -poly[last][1]);
  for (let i = last - 1; i >= 0; i--) {
    shape.lineTo(poly[i][0], -poly[i][1]);
  }
  shape.closePath();

  const geo = new ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);

  // ShapeGeometry is indexed — iterate via index buffer to emit triangles
  const pAttr = geo.attributes.position;
  const idx = geo.index;
  if (idx) {
    for (let i = 0; i < idx.count; i++) {
      const vi = idx.getX(i);
      pos.push(pAttr.getX(vi), roofY, pAttr.getZ(vi));
      nor.push(0, 1, 0);
      col.push(cr, cg, cb);
    }
  } else {
    for (let v = 0; v < pAttr.count; v++) {
      pos.push(pAttr.getX(v), roofY, pAttr.getZ(v));
      nor.push(0, 1, 0);
      col.push(cr, cg, cb);
    }
  }

  geo.dispose();
}

// ─── Helpers ────────────────────────────────────────────────────

function makeBufferGeo(
  positions: number[],
  normals: number[],
  colors: number[],
  uvs?: number[],
): BufferGeometry {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  if (uvs && uvs.length > 0) {
    geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
  return geo;
}
