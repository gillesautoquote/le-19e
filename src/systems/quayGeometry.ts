/**
 * quayGeometry.ts — Build canal trench with stone walkway + walls + bed.
 *
 * Cross-section (from outside → inside):
 *   terrain → [stone walkway 3m] → [raised rim +20cm] → [wall ↓3m] → [bed]
 *
 * All edges computed from a shared subdivided centerline so vertex counts
 * always match between left/right/outer/inner polylines.
 */

import { BufferGeometry, Float32BufferAttribute, Color } from 'three';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { WORLD } from '@/constants/world';
import { EPOCH_A } from '@/constants/epochs';
import type { SceneWater } from '@/types/osm';

/** Width of stone walkway on each bank (meters). */
const WALKWAY_WIDTH = WORLD.canalWalkwayWidth;

/** Walkway Y offset above terrain to prevent z-fighting. */
const WALKWAY_Y_OFFSET = 0.05;

/** Raised rim height at canal edge (meters above walkway). */
const RIM_HEIGHT = 0.2;

/** Max distance between subdivision points (meters). */
const SUBDIV_LEN = 5;

// ─── Cross-section computation ─────────────────────────────────────

interface CrossSection {
  leftOuter: { x: number; z: number };
  leftInner: { x: number; z: number };
  rightInner: { x: number; z: number };
  rightOuter: { x: number; z: number };
}

/**
 * Subdivide the waterway centerline, then compute four offset polylines
 * at each point: leftOuter, leftInner, rightInner, rightOuter.
 * Guarantees all arrays have the same length.
 */
function computeCrossSections(
  pts: [number, number][],
  halfW: number,
): CrossSection[] {
  // 1. Subdivide centerline
  const center: { x: number; z: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dz = pts[i + 1][1] - pts[i][1];
    const len = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.max(1, Math.ceil(len / SUBDIV_LEN));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      center.push({ x: pts[i][0] + dx * t, z: pts[i][1] + dz * t });
    }
  }
  center.push({ x: pts[pts.length - 1][0], z: pts[pts.length - 1][1] });

  // 2. At each point, compute perpendicular offsets
  const outerDist = halfW + WALKWAY_WIDTH;
  const sections: CrossSection[] = [];

  for (let i = 0; i < center.length; i++) {
    let dx = 0;
    let dz = 0;
    if (i < center.length - 1) {
      const fx = center[i + 1].x - center[i].x;
      const fz = center[i + 1].z - center[i].z;
      const fl = Math.sqrt(fx * fx + fz * fz);
      if (fl > 0.001) { dx += fx / fl; dz += fz / fl; }
    }
    if (i > 0) {
      const bx = center[i].x - center[i - 1].x;
      const bz = center[i].z - center[i - 1].z;
      const bl = Math.sqrt(bx * bx + bz * bz);
      if (bl > 0.001) { dx += bx / bl; dz += bz / bl; }
    }
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) continue;

    const nx = -dz / len;
    const nz = dx / len;
    const cx = center[i].x;
    const cz = center[i].z;

    sections.push({
      leftOuter: { x: cx + nx * outerDist, z: cz + nz * outerDist },
      leftInner: { x: cx + nx * halfW, z: cz + nz * halfW },
      rightInner: { x: cx - nx * halfW, z: cz - nz * halfW },
      rightOuter: { x: cx - nx * outerDist, z: cz - nz * outerDist },
    });
  }

  return sections;
}

// ─── Geometry builders ──────────────────────────────────────────────

type Buf = { v: number[]; c: number[]; idx: number[]; base: number };

/** Add a pair of vertices + color, build quad with previous pair. */
function pushPair(
  buf: Buf,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  color: Color, isFirst: boolean,
): void {
  buf.v.push(x1, y1, z1, x2, y2, z2);
  buf.c.push(color.r, color.g, color.b, color.r, color.g, color.b);
  if (!isFirst) {
    const p = buf.base - 2;
    const c = buf.base;
    buf.idx.push(p, p + 1, c, p + 1, c + 1, c);
  }
  buf.base += 2;
}

/** Build horizontal walkway strip: outer edge → inner rim. */
function buildWalkway(sections: CrossSection[], side: 'left' | 'right', buf: Buf, color: Color): void {
  for (let i = 0; i < sections.length; i++) {
    const outer = side === 'left' ? sections[i].leftOuter : sections[i].rightOuter;
    const inner = side === 'left' ? sections[i].leftInner : sections[i].rightInner;
    const outerY = getTerrainHeight(outer.x, outer.z) + WALKWAY_Y_OFFSET;
    const innerY = getTerrainHeight(inner.x, inner.z) + RIM_HEIGHT;
    pushPair(buf, outer.x, outerY, outer.z, inner.x, innerY, inner.z, color, i === 0);
  }
}

/** Build vertical wall strip: from rim top down to bed depth. */
function buildWall(sections: CrossSection[], side: 'left' | 'right', buf: Buf, color: Color): void {
  const bedDepth = WORLD.canalBedDepth;
  for (let i = 0; i < sections.length; i++) {
    const pt = side === 'left' ? sections[i].leftInner : sections[i].rightInner;
    const terrY = getTerrainHeight(pt.x, pt.z);
    pushPair(buf, pt.x, terrY + RIM_HEIGHT, pt.z, pt.x, terrY - bedDepth, pt.z, color, i === 0);
  }
}

/** Build flat bed connecting left and right wall bottoms. */
function buildBed(sections: CrossSection[], buf: Buf, color: Color): void {
  const bedDepth = WORLD.canalBedDepth;
  for (let i = 0; i < sections.length; i++) {
    const lp = sections[i].leftInner;
    const rp = sections[i].rightInner;
    const avgY = (getTerrainHeight(lp.x, lp.z) + getTerrainHeight(rp.x, rp.z)) / 2;
    const bedY = avgY - bedDepth;
    pushPair(buf, lp.x, bedY, lp.z, rp.x, bedY, rp.z, color, i === 0);
  }
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Build complete canal trench geometry for all waterways:
 * walkways + walls + bed, with vertex colors.
 */
export function buildQuayWallGeometry(waterways: SceneWater[]): BufferGeometry | null {
  const buf: Buf = { v: [], c: [], idx: [], base: 0 };
  const wallColor = new Color(EPOCH_A.canalWall);
  const bedColor = new Color(EPOCH_A.canalBed);

  for (const ww of waterways) {
    if (ww.points.length < 2) continue;
    const sections = computeCrossSections(ww.points, ww.width / 2);
    if (sections.length < 2) continue;

    // Stone walkways (horizontal, both sides)
    buildWalkway(sections, 'left', buf, wallColor);
    buildWalkway(sections, 'right', buf, wallColor);
    // Vertical walls (both sides)
    buildWall(sections, 'left', buf, wallColor);
    buildWall(sections, 'right', buf, wallColor);
    // Canal bed (flat bottom)
    buildBed(sections, buf, bedColor);
  }

  if (buf.v.length === 0) return null;

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(buf.v, 3));
  geo.setAttribute('color', new Float32BufferAttribute(buf.c, 3));
  geo.setIndex(buf.idx);
  geo.computeVertexNormals();
  return geo;
}
