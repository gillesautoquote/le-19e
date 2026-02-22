import { EPOCH_A } from '@/constants/epochs';
import { WORLD } from '@/constants/world';
import { drawPlayerIndicators } from '@/ui/minimapPlayerDraw';
import type { SceneObjects } from '@/types/osm';

export const MINIMAP_SIZE = 180;

const RANGE_X = WORLD.boundsXMax - WORLD.boundsXMin;
const RANGE_Z = WORLD.boundsZMax - WORLD.boundsZMin;

export function worldToMinimap(worldX: number, worldZ: number): { x: number; y: number } {
  const x = ((worldX - WORLD.boundsXMin) / RANGE_X) * MINIMAP_SIZE;
  const y = MINIMAP_SIZE - ((worldZ - WORLD.boundsZMin) / RANGE_Z) * MINIMAP_SIZE;
  return { x, y };
}

export function minimapToWorld(mx: number, my: number): [number, number, number] {
  const worldX = WORLD.boundsXMin + (mx / MINIMAP_SIZE) * RANGE_X;
  const worldZ = WORLD.boundsZMin + ((MINIMAP_SIZE - my) / MINIMAP_SIZE) * RANGE_Z;
  return [worldX, 0, worldZ];
}

interface MinimapDrawData {
  merged: SceneObjects;
  playerPos: { x: number; y: number };
  rotation: number;
  theta: number;
  time: number;
}

export function drawMinimap(ctx: CanvasRenderingContext2D, data: MinimapDrawData): void {
  const { merged, playerPos: pp, rotation, theta, time } = data;
  const SIZE = MINIMAP_SIZE;

  ctx.clearRect(0, 0, SIZE, SIZE);

  // Rotate entire map around player position based on camera angle
  ctx.save();
  ctx.translate(pp.x, pp.y);
  ctx.rotate(-theta);
  ctx.translate(-pp.x, -pp.y);

  // Background (ground color)
  ctx.fillStyle = EPOCH_A.ground;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(-SIZE, -SIZE, SIZE * 3, SIZE * 3);
  ctx.globalAlpha = 1;

  // Parks (green polygons)
  ctx.fillStyle = EPOCH_A.vegetation;
  ctx.globalAlpha = 0.5;
  for (const park of merged.parks) {
    if (park.polygon.length < 3) continue;
    ctx.beginPath();
    const rp0 = worldToMinimap(park.polygon[0][0], park.polygon[0][1]);
    ctx.moveTo(rp0.x, rp0.y);
    for (let i = 1; i < park.polygon.length; i++) {
      const rp = worldToMinimap(park.polygon[i][0], park.polygon[i][1]);
      ctx.lineTo(rp.x, rp.y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Roads (grey polylines)
  for (const road of merged.roads) {
    if (road.points.length < 2) continue;
    ctx.strokeStyle = EPOCH_A.roadPrimary;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(0.5, (road.width / RANGE_X) * SIZE * 0.8);
    ctx.beginPath();
    const rr0 = worldToMinimap(road.points[0][0], road.points[0][1]);
    ctx.moveTo(rr0.x, rr0.y);
    for (let i = 1; i < road.points.length; i++) {
      const rr = worldToMinimap(road.points[i][0], road.points[i][1]);
      ctx.lineTo(rr.x, rr.y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Waterways (turquoise polylines)
  for (const w of merged.water) {
    if (w.points.length < 2) continue;
    ctx.strokeStyle = EPOCH_A.water;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = Math.max(1, (w.width / RANGE_X) * SIZE);
    ctx.beginPath();
    const rw0 = worldToMinimap(w.points[0][0], w.points[0][1]);
    ctx.moveTo(rw0.x, rw0.y);
    for (let i = 1; i < w.points.length; i++) {
      const rwp = worldToMinimap(w.points[i][0], w.points[i][1]);
      ctx.lineTo(rwp.x, rwp.y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Buildings (real polygons)
  ctx.globalAlpha = 0.55;
  for (const b of merged.buildings) {
    if (b.polygon.length < 3) continue;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    const rb0 = worldToMinimap(b.polygon[0][0], b.polygon[0][1]);
    ctx.moveTo(rb0.x, rb0.y);
    for (let i = 1; i < b.polygon.length; i++) {
      const rbp = worldToMinimap(b.polygon[i][0], b.polygon[i][1]);
      ctx.lineTo(rbp.x, rbp.y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore(); // End of rotated context

  // Player indicators (drawn AFTER rotation, so they stay stable)
  const vw = (55 / RANGE_X) * SIZE;
  const vh = (35 / RANGE_Z) * SIZE;
  drawPlayerIndicators(ctx, {
    px: pp.x,
    py: pp.y,
    rotation,
    theta,
    time,
    viewWidth: vw,
    viewHeight: vh,
  });
}
