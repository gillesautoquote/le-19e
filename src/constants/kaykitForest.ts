export interface KaykitTreeDef {
  key: string;
  path: string;
  nativeHeight: number; // Y axis (metres) — measured from GLB accessors
}

/** Deciduous trees from KayKit Forest Nature Pack (CC0).
 *  Bare trees removed — the game is set in summer Paris. */
export const KAYKIT_TREES: KaykitTreeDef[] = [
  // Style 1 — round canopy
  { key: 'T1A', path: '/models/kaykit/forest/Tree_1_A_Color1.glb', nativeHeight: 4.161 },
  { key: 'T1B', path: '/models/kaykit/forest/Tree_1_B_Color1.glb', nativeHeight: 4.930 },
  // Style 2 — conical / poplar-like
  { key: 'T2A', path: '/models/kaykit/forest/Tree_2_A_Color1.glb', nativeHeight: 4.675 },
  { key: 'T2C', path: '/models/kaykit/forest/Tree_2_C_Color1.glb', nativeHeight: 6.920 },
  // Style 3 — wide canopy (platane-like, very Parisian)
  { key: 'T3A', path: '/models/kaykit/forest/Tree_3_A_Color1.glb', nativeHeight: 3.507 },
  { key: 'T3B', path: '/models/kaykit/forest/Tree_3_B_Color1.glb', nativeHeight: 4.353 },
  // Style 4 — tall narrow
  { key: 'T4A', path: '/models/kaykit/forest/Tree_4_A_Color1.glb', nativeHeight: 5.274 },
  { key: 'T4B', path: '/models/kaykit/forest/Tree_4_B_Color1.glb', nativeHeight: 6.943 },
  // Extra variants for more diversity
  { key: 'T1C', path: '/models/kaykit/forest/Tree_1_C_Color1.glb', nativeHeight: 7.814 },
  { key: 'T2B', path: '/models/kaykit/forest/Tree_2_B_Color1.glb', nativeHeight: 6.042 },
  { key: 'T2D', path: '/models/kaykit/forest/Tree_2_D_Color1.glb', nativeHeight: 8.088 },
  { key: 'T2E', path: '/models/kaykit/forest/Tree_2_E_Color1.glb', nativeHeight: 8.792 },
  { key: 'T3C', path: '/models/kaykit/forest/Tree_3_C_Color1.glb', nativeHeight: 5.792 },
  { key: 'T4C', path: '/models/kaykit/forest/Tree_4_C_Color1.glb', nativeHeight: 10.774 },
];

export interface KaykitBushDef {
  key: string;
  path: string;
  nativeHeight: number;
}

export interface KaykitGrassDef {
  key: string;
  path: string;
  nativeHeight: number;
}

/** Grass tufts for parks — 4 variants (2 short, 2 tall). */
export const KAYKIT_GRASS: KaykitGrassDef[] = [
  { key: 'G1B', path: '/models/kaykit/forest/Grass_1_B_Color1.glb', nativeHeight: 0.520 },
  { key: 'G1C', path: '/models/kaykit/forest/Grass_1_C_Color1.glb', nativeHeight: 0.580 },
  { key: 'G2B', path: '/models/kaykit/forest/Grass_2_B_Color1.glb', nativeHeight: 0.919 },
  { key: 'G2C', path: '/models/kaykit/forest/Grass_2_C_Color1.glb', nativeHeight: 0.934 },
];

/** Bushes for parks and green areas. */
export const KAYKIT_BUSHES: KaykitBushDef[] = [
  { key: 'B1A', path: '/models/kaykit/forest/Bush_1_A_Color1.glb', nativeHeight: 0.227 },
  { key: 'B1D', path: '/models/kaykit/forest/Bush_1_D_Color1.glb', nativeHeight: 0.994 },
  { key: 'B2A', path: '/models/kaykit/forest/Bush_2_A_Color1.glb', nativeHeight: 0.528 },
  { key: 'B2D', path: '/models/kaykit/forest/Bush_2_D_Color1.glb', nativeHeight: 0.858 },
  { key: 'B3A', path: '/models/kaykit/forest/Bush_3_A_Color1.glb', nativeHeight: 0.485 },
  { key: 'B4A', path: '/models/kaykit/forest/Bush_4_A_Color1.glb', nativeHeight: 0.434 },
  // Extra variants for more diversity
  { key: 'B1B', path: '/models/kaykit/forest/Bush_1_B_Color1.glb', nativeHeight: 0.484 },
  { key: 'B1C', path: '/models/kaykit/forest/Bush_1_C_Color1.glb', nativeHeight: 0.807 },
  { key: 'B2B', path: '/models/kaykit/forest/Bush_2_B_Color1.glb', nativeHeight: 0.858 },
  { key: 'B2C', path: '/models/kaykit/forest/Bush_2_C_Color1.glb', nativeHeight: 1.320 },
  { key: 'B3B', path: '/models/kaykit/forest/Bush_3_B_Color1.glb', nativeHeight: 0.804 },
  { key: 'B4B', path: '/models/kaykit/forest/Bush_4_B_Color1.glb', nativeHeight: 0.743 },
];
