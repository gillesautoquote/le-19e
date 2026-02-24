export interface KaykitUrbanDef {
  key: string;
  path: string;
  nativeHeight: number; // Y axis (metres) — measured from GLB accessors
  scale: number;        // uniform scale to reach realistic size
}

export const KAYKIT_TRAFFIC_LIGHTS: KaykitUrbanDef[] = [
  {
    key: 'trafficlight_A',
    path: '/models/kaykit/trafficlight_A.glb',
    nativeHeight: 0.729,
    scale: 4.8,  // 0.729 * 4.8 ≈ 3.5m real
  },
];

export const KAYKIT_TRASH: KaykitUrbanDef[] = [
  {
    key: 'trash_A',
    path: '/models/kaykit/trash_A.glb',
    nativeHeight: 0.052,
    scale: 15.4, // 0.052 * 15.4 ≈ 0.8m real
  },
];

export const ALL_KAYKIT_URBAN: KaykitUrbanDef[] = [
  ...KAYKIT_TRAFFIC_LIGHTS,
  ...KAYKIT_TRASH,
];
