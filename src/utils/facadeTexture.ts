import { CanvasTexture, NearestFilter, RepeatWrapping } from 'three';

// ─── Procedural Haussmannian facade texture ─────────────────────
// 64×64 tiling texture: one floor, two French windows with shutters.
// Colors inspired by Kenney modular-buildings colormap — warm stone,
// slate blue glass, blue-gray shutters, iron balcony.
// All colors stay neutral-ish so vertex-color multiplication
// tints each building to its epoch palette.

export interface FacadeTextureResult {
  texture: CanvasTexture;
  /** Vertical repeat distance in scene units (meters). */
  floorHeight: number;
  /** Horizontal repeat distance in scene units (meters). */
  tileWidth: number;
}

// Palette sampled from Kenney modular-buildings colormap
// (multiplied by per-building vertex color at render)
const WALL = '#EAD8C4';       // warm peach-cream (Kenney wall tone)
const GLASS = '#5080B0';      // Kenney signature blue windows
const FRAME = '#C0B8A8';      // warm stone frame
const SHUTTER = '#6878A0';    // blue-gray shutters (Kenney accent)
const CORNICE = '#D8D0C0';    // light stone molding
const RAILING = '#505860';    // wrought iron balcony

const SIZE = 64;
const FLOOR_HEIGHT = 3.5;
const TILE_WIDTH = 6.0;

let cachedResult: FacadeTextureResult | null = null;

export function createFacadeTexture(): FacadeTextureResult {
  if (cachedResult) return cachedResult;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // ── Base wall ───────────────────────────────────────────
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── Cornice / molding band (top of floor tile) ──────────
  ctx.fillStyle = CORNICE;
  ctx.fillRect(0, 0, SIZE, 4);
  // Thin shadow line below cornice
  ctx.fillStyle = FRAME;
  ctx.fillRect(0, 4, SIZE, 1);

  // ── Floor separation line (bottom) ──────────────────────
  ctx.fillStyle = CORNICE;
  ctx.fillRect(0, 59, SIZE, 3);
  ctx.fillStyle = FRAME;
  ctx.fillRect(0, 62, SIZE, 1);

  // ── Two French windows with shutters ────────────────────
  // Window bay 1: pixels 5–28
  drawFrenchWindow(ctx, 5);
  // Window bay 2: pixels 36–59
  drawFrenchWindow(ctx, 36);

  // ── Balcony railing (continuous iron rail between bays) ─
  ctx.fillStyle = RAILING;
  ctx.fillRect(3, 49, 58, 1);
  // Vertical balusters (every 4px)
  for (let bx = 5; bx < 60; bx += 4) {
    ctx.fillRect(bx, 49, 1, 2);
  }

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  cachedResult = { texture, floorHeight: FLOOR_HEIGHT, tileWidth: TILE_WIDTH };
  return cachedResult;
}

/** Draw one tall French window with shutters at horizontal offset `x0`. */
function drawFrenchWindow(ctx: CanvasRenderingContext2D, x0: number): void {
  const shutterW = 5;
  const frameW = 1;
  const glassW = 10;
  const winTop = 7;
  const winBot = 48;
  const winH = winBot - winTop;

  // Left shutter
  ctx.fillStyle = SHUTTER;
  ctx.fillRect(x0, winTop, shutterW, winH);
  // Shutter detail line (horizontal slat hint)
  ctx.fillStyle = '#586898';
  ctx.fillRect(x0, winTop + Math.floor(winH / 3), shutterW, 1);
  ctx.fillRect(x0, winTop + Math.floor((winH * 2) / 3), shutterW, 1);

  // Frame left
  ctx.fillStyle = FRAME;
  ctx.fillRect(x0 + shutterW, winTop - 1, frameW, winH + 2);

  // Glass (tall French window pane)
  ctx.fillStyle = GLASS;
  ctx.fillRect(x0 + shutterW + frameW, winTop, glassW, winH);

  // Vertical mullion (splits window in two panes)
  ctx.fillStyle = FRAME;
  const mullionX = x0 + shutterW + frameW + Math.floor(glassW / 2);
  ctx.fillRect(mullionX, winTop, 1, winH);

  // Horizontal transom bar (upper third)
  const transomY = winTop + Math.floor(winH * 0.28);
  ctx.fillRect(x0 + shutterW + frameW, transomY, glassW, 1);

  // Frame right
  ctx.fillRect(x0 + shutterW + frameW + glassW, winTop - 1, frameW, winH + 2);

  // Right shutter
  ctx.fillStyle = SHUTTER;
  ctx.fillRect(x0 + shutterW + frameW * 2 + glassW, winTop, shutterW, winH);
  ctx.fillStyle = '#586898';
  ctx.fillRect(x0 + shutterW + frameW * 2 + glassW, winTop + Math.floor(winH / 3), shutterW, 1);
  ctx.fillRect(x0 + shutterW + frameW * 2 + glassW, winTop + Math.floor((winH * 2) / 3), shutterW, 1);

  // Lintel above window (stone cap)
  ctx.fillStyle = CORNICE;
  ctx.fillRect(x0 + shutterW, winTop - 2, glassW + frameW * 2, 1);

  // Window sill
  ctx.fillStyle = FRAME;
  ctx.fillRect(x0 + shutterW - 1, winBot, glassW + frameW * 2 + 2, 2);
}
