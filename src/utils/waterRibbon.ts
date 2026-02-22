import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { SceneWater } from '@/types/osm';

// ─── Ribbon geometry builder ────────────────────────────────────

export const SUBDIVISION_LENGTH = 5; // meters — enough vertices for smooth waves

/**
 * Build a flat ribbon geometry along waterway centerlines.
 * Geometry lives in XY plane (matching PlaneGeometry convention).
 * After mesh rotateX(-PI/2), local (x,y,z) → world (x, z, -y),
 * so we map: local x = scene x, local y = -scene z.
 */
export function buildWaterRibbon(waterways: SceneWater[]): BufferGeometry | null {
  const verts: number[] = [];
  const indices: number[] = [];
  let vertIndex = 0;

  for (const waterway of waterways) {
    const pts = waterway.points;
    if (pts.length < 2) continue;
    const halfW = waterway.width / 2;

    // Build subdivided centerline in local geometry space
    const centerline: { x: number; y: number }[] = [];

    for (let i = 0; i < pts.length - 1; i++) {
      const [sx1, sz1] = pts[i];
      const [sx2, sz2] = pts[i + 1];
      const lx1 = sx1;
      const ly1 = -sz1;
      const lx2 = sx2;
      const ly2 = -sz2;

      const dx = lx2 - lx1;
      const dy = ly2 - ly1;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      if (segLen < 0.01) continue;

      const numSubs = Math.max(1, Math.ceil(segLen / SUBDIVISION_LENGTH));
      for (let s = 0; s < numSubs; s++) {
        const t = s / numSubs;
        centerline.push({ x: lx1 + dx * t, y: ly1 + dy * t });
      }
    }
    // Add last point
    const lastPt = pts[pts.length - 1];
    centerline.push({ x: lastPt[0], y: -lastPt[1] });

    if (centerline.length < 2) continue;

    // Generate left/right vertex pairs along centerline
    const startVert = vertIndex;

    for (let i = 0; i < centerline.length; i++) {
      const p = centerline[i];

      // Averaged unit-direction for smooth perpendicular
      let dx = 0;
      let dy = 0;
      if (i < centerline.length - 1) {
        const fx = centerline[i + 1].x - p.x;
        const fy = centerline[i + 1].y - p.y;
        const fl = Math.sqrt(fx * fx + fy * fy);
        if (fl > 0.001) { dx += fx / fl; dy += fy / fl; }
      }
      if (i > 0) {
        const bx = p.x - centerline[i - 1].x;
        const by = p.y - centerline[i - 1].y;
        const bl = Math.sqrt(bx * bx + by * by);
        if (bl > 0.001) { dx += bx / bl; dy += by / bl; }
      }
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.001) {
        // Degenerate point — duplicate previous pair direction
        if (verts.length >= 6) {
          verts.push(verts[verts.length - 6], verts[verts.length - 5], 0);
          verts.push(verts[verts.length - 5], verts[verts.length - 4], 0);
          vertIndex += 2;
        }
        continue;
      }

      const nx = (-dy / len) * halfW;
      const ny = (dx / len) * halfW;

      verts.push(p.x + nx, p.y + ny, 0); // left
      verts.push(p.x - nx, p.y - ny, 0); // right
      vertIndex += 2;
    }

    // Build triangle strip indices
    const numPairs = (vertIndex - startVert) / 2;
    for (let i = 0; i < numPairs - 1; i++) {
      const a = startVert + i * 2;
      indices.push(a, a + 1, a + 2);
      indices.push(a + 1, a + 3, a + 2);
    }
  }

  if (verts.length === 0) return null;

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  return geo;
}
