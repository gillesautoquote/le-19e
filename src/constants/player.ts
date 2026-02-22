export const PLAYER = {
  walkSpeed: 8,
  bobSpeed: 8,
  bobAmplitude: 0.15,
  arrivalThreshold: 0.3,
  keyboardMoveSpeed: 12,
  turboMultiplier: 3,

  // Body dimensions
  bodyWidth: 0.8,
  bodyHeight: 1.5,
  bodyDepth: 0.5,
  bodyY: 1.75,

  headSize: 0.6,
  headY: 2.8,

  legWidth: 0.3,
  legHeight: 1.0,
  legDepth: 0.3,
  legY: 0.5,
  legOffsetX: 0.2,

  // Start position — Quai de la Seine, west bank of Bassin de la Villette
  startX: 200,
  startZ: -150,
} as const;

// Click indicator
export const CLICK_INDICATOR = {
  innerRadius: 0.3,
  outerRadius: 0.5,
  segments: 8,
  duration: 500,
  initialOpacity: 0.8,
} as const;
