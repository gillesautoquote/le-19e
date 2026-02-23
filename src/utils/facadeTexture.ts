import { CanvasTexture, NearestFilter, RepeatWrapping } from 'three';

// ─── Procedural facade texture ──────────────────────────────────
// Generates a 64×64 tiling texture representing one floor of a
// Parisian building facade (2 windows per tile).
// Colors are neutral/white so vertex-color multiplication tints
// walls to each building's epoch palette color.

export interface FacadeTextureResult {
  texture: CanvasTexture;
  /** Vertical repeat distance in scene units (meters). */
  floorHeight: number;
  /** Horizontal repeat distance in scene units (meters). */
  tileWidth: number;
}

// Neutral colors — multiplied by vertex color at render time
const WALL = '#FFFFFF';
const GLASS = '#4A5A6A';
const FRAME = '#C0C0B8';
const LEDGE = '#D8D8D0';

const SIZE = 64;
const FLOOR_HEIGHT = 3.5;
const TILE_WIDTH = 6.0;

// Window layout (pixel ranges within 64px tile)
const WIN_TOP = 8;
const WIN_BOTTOM = 42;
const FRAME_W = 2;
const PILLAR = 6;
const WIN_W = 18;
const PIER = 10;

let cachedResult: FacadeTextureResult | null = null;

export function createFacadeTexture(): FacadeTextureResult {
  if (cachedResult) return cachedResult;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // Fill entire tile with wall color
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Floor ledge / cornice line (subtle horizontal band)
  ctx.fillStyle = LEDGE;
  ctx.fillRect(0, 0, SIZE, 3);
  ctx.fillRect(0, SIZE - 6, SIZE, 3);

  // Draw two windows
  drawWindow(ctx, PILLAR, WIN_TOP, WIN_W, WIN_BOTTOM - WIN_TOP);
  drawWindow(ctx, PILLAR + WIN_W + FRAME_W * 2 + PIER, WIN_TOP, WIN_W, WIN_BOTTOM - WIN_TOP);

  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  cachedResult = { texture, floorHeight: FLOOR_HEIGHT, tileWidth: TILE_WIDTH };
  return cachedResult;
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  // Frame
  ctx.fillStyle = FRAME;
  ctx.fillRect(x, y, w + FRAME_W * 2, h + FRAME_W * 2);

  // Glass pane
  ctx.fillStyle = GLASS;
  ctx.fillRect(x + FRAME_W, y + FRAME_W, w, h);

  // Horizontal mullion (divides window into upper/lower panes)
  ctx.fillStyle = FRAME;
  const mullionY = y + FRAME_W + Math.floor(h * 0.55);
  ctx.fillRect(x + FRAME_W, mullionY, w, 2);
}
