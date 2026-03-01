export interface KaykitRockDef {
  key: string;
  path: string;
  nativeHeight: number;
}

/** KayKit Forest rocks — 3 size categories, 2-3 variants each. */
export const KAYKIT_ROCKS: KaykitRockDef[] = [
  // Small rocks
  { key: 'R1A', path: '/models/kaykit/forest/Rock_1_A_Color1.glb', nativeHeight: 0.540 },
  { key: 'R1D', path: '/models/kaykit/forest/Rock_1_D_Color1.glb', nativeHeight: 1.130 },
  { key: 'R1H', path: '/models/kaykit/forest/Rock_1_H_Color1.glb', nativeHeight: 1.868 },
  // Medium rocks
  { key: 'R2A', path: '/models/kaykit/forest/Rock_2_A_Color1.glb', nativeHeight: 0.216 },
  { key: 'R2D', path: '/models/kaykit/forest/Rock_2_D_Color1.glb', nativeHeight: 1.740 },
  // Large rocks
  { key: 'R3A', path: '/models/kaykit/forest/Rock_3_A_Color1.glb', nativeHeight: 0.859 },
  { key: 'R3E', path: '/models/kaykit/forest/Rock_3_E_Color1.glb', nativeHeight: 1.288 },
  { key: 'R3K', path: '/models/kaykit/forest/Rock_3_K_Color1.glb', nativeHeight: 2.223 },
];
