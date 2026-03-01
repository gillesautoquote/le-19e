import {
  BufferGeometry,
  Float32BufferAttribute,
  Shape,
  ShapeGeometry,
  Color,
} from 'three';
import type { SceneBuilding } from '@/types/osm';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { BUILDING_STYLES } from '@/constants/kenneyModules';
import type { KenneyModuleDef, BuildingStyle } from '@/constants/kenneyModules';

// ─── Constants ──────────────────────────────────────────────────

const FLOOR_HEIGHT = 3.5;
/** Smaller modules = more windows per wall = more detail. */
const MODULE_WIDTH = 2.5;
const MIN_EDGE_LEN = 0.5;
const DOOR_CHANCE = 0.3;
const AC_CHANCE = 0.08;
const AC_KEY = 'detail-ac';
const NATIVE_HEIGHT = 0.625;
const FACADE_DEPTH = 0.8;
/** Boost so instanceColor × Lambert-lit texture ≈ target palette tone. */
const COLOR_BOOST = 1.5;

// ─── Types ──────────────────────────────────────────────────────

export interface ModuleInstance {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  /** Per-building tint (epoch color) — multiplied with texture. */
  cr: number;
  cg: number;
  cb: number;
}

export interface NamedBuildingLabel {
  id: string;
  name: string;
  cx: number;
  cz: number;
  topY: number;
}

export interface FacadeTilingResult {
  moduleInstances: Map<string, ModuleInstance[]>;
  roofGeometry: BufferGeometry | null;
  namedBuildings: NamedBuildingLabel[];
}

// ─── Hash-based module selection ────────────────────────────────

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

function selectStyle(buildingId: string): BuildingStyle {
  return BUILDING_STYLES[Math.abs(hashCode(buildingId)) % BUILDING_STYLES.length];
}

// ─── Main entry point ───────────────────────────────────────────

export function computeFacadeTiling(
  buildings: SceneBuilding[],
): FacadeTilingResult {
  const instanceMap = new Map<string, ModuleInstance[]>();
  const labels: NamedBuildingLabel[] = [];

  const rPos: number[] = [];
  const rNor: number[] = [];
  const rCol: number[] = [];
  const tmpColor = new Color();

  for (const b of buildings) {
    const poly = b.polygon;
    if (poly.length < 3) continue;

    let cx = 0;
    let cz = 0;
    for (const [x, z] of poly) { cx += x; cz += z; }
    cx /= poly.length;
    cz /= poly.length;

    const terrainY = getTerrainHeight(cx, cz);
    const floors = Math.max(1, Math.round(b.height / FLOOR_HEIGHT));
    const floorH = b.height / floors;

    tmpColor.set(b.color);
    const cr = Math.min(1, tmpColor.r * COLOR_BOOST);
    const cg = Math.min(1, tmpColor.g * COLOR_BOOST);
    const cb = Math.min(1, tmpColor.b * COLOR_BOOST);
    const style = selectStyle(b.id);
    tileWalls(b, poly, terrainY, floors, floorH, cr, cg, cb, style, instanceMap);
    buildRoof(poly, terrainY + b.height, tmpColor.r, tmpColor.g, tmpColor.b, rPos, rNor, rCol);

    if (b.name) {
      labels.push({ id: b.id, name: b.name, cx, cz, topY: terrainY + b.height });
    }
  }

  return {
    moduleInstances: instanceMap,
    roofGeometry: rPos.length > 0 ? makeBufferGeo(rPos, rNor, rCol) : null,
    namedBuildings: labels,
  };
}

// ─── Wall tiling ────────────────────────────────────────────────

function tileWalls(
  b: SceneBuilding,
  poly: [number, number][],
  terrainY: number,
  floors: number,
  floorH: number,
  cr: number, cg: number, cb: number,
  style: BuildingStyle,
  instanceMap: Map<string, ModuleInstance[]>,
): void {
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    const x0 = poly[i][0], z0 = poly[i][1];
    const x1 = poly[j][0], z1 = poly[j][1];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const edgeLen = Math.sqrt(dx * dx + dz * dz);
    if (edgeLen < MIN_EDGE_LEN) continue;

    const modulesPerEdge = Math.max(1, Math.round(edgeLen / MODULE_WIDTH));
    const moduleW = edgeLen / modulesPerEdge;
    const rotationY = Math.atan2(dx, dz) - Math.PI / 2;

    for (let col = 0; col < modulesPerEdge; col++) {
      const t = (col + 0.5) / modulesPerEdge;
      const mx = x0 + dx * t;
      const mz = z0 + dz * t;

      for (let row = 0; row < floors; row++) {
        const isGround = row === 0;
        let mod: KenneyModuleDef;
        if (isGround) {
          const hash = Math.abs(hashCode(`${b.id}-${i}-${col}`));
          mod = (hash % 100) < (DOOR_CHANCE * 100)
            ? style.groundDoor : style.groundWindow;
        } else {
          mod = style.upperWindow;
        }

        let arr = instanceMap.get(mod.key);
        if (!arr) { arr = []; instanceMap.set(mod.key, arr); }

        arr.push({
          x: mx,
          y: terrainY + row * floorH,
          z: mz,
          rotationY,
          scaleX: moduleW,
          scaleY: floorH / NATIVE_HEIGHT,
          scaleZ: FACADE_DEPTH,
          cr, cg, cb,
        });

        // ~8 % of upper floors get an AC unit overlay
        if (!isGround) {
          const acHash = Math.abs(hashCode(`ac-${b.id}-${i}-${col}-${row}`));
          if ((acHash % 100) < (AC_CHANCE * 100)) {
            let acArr = instanceMap.get(AC_KEY);
            if (!acArr) { acArr = []; instanceMap.set(AC_KEY, acArr); }
            acArr.push({
              x: mx, y: terrainY + row * floorH, z: mz,
              rotationY,
              scaleX: moduleW,
              scaleY: floorH / NATIVE_HEIGHT,
              scaleZ: FACADE_DEPTH,
              cr: 0.7, cg: 0.7, cb: 0.7,
            });
          }
        }
      }
    }
  }
}

// ─── Roof geometry (flat ShapeGeometry cap) ─────────────────────

function buildRoof(
  poly: [number, number][],
  roofY: number,
  cr: number, cg: number, cb: number,
  pos: number[], nor: number[], col: number[],
): void {
  const shape = new Shape();
  const last = poly.length - 1;
  shape.moveTo(poly[last][0], -poly[last][1]);
  for (let i = last - 1; i >= 0; i--) {
    shape.lineTo(poly[i][0], -poly[i][1]);
  }
  shape.closePath();

  const geo = new ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);

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
): BufferGeometry {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geo;
}
