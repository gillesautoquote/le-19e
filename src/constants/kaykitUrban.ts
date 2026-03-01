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

export const KAYKIT_BENCHES: KaykitUrbanDef[] = [
  {
    key: 'bench',
    path: '/models/kaykit/bench.glb',
    nativeHeight: 0.100,
    scale: 5.0, // 0.100 * 5.0 ≈ 0.5m seat height
  },
];

export const KAYKIT_FIRE_HYDRANTS: KaykitUrbanDef[] = [
  {
    key: 'firehydrant',
    path: '/models/kaykit/firehydrant.glb',
    nativeHeight: 0.225,
    scale: 3.0, // 0.225 * 3.0 ≈ 0.68m real
  },
];

export const KAYKIT_DUMPSTERS: KaykitUrbanDef[] = [
  {
    key: 'dumpster',
    path: '/models/kaykit/dumpster.glb',
    nativeHeight: 0.317,
    scale: 4.0, // 0.317 * 4.0 ≈ 1.27m real
  },
];

export const KAYKIT_STREETLIGHTS: KaykitUrbanDef[] = [
  {
    key: 'streetlight_old_double',
    path: '/models/kaykit/streetlight_old_double.glb',
    nativeHeight: 0.700,
    scale: 5.7, // 0.700 * 5.7 ≈ 4.0m real
  },
];

export const ALL_KAYKIT_URBAN: KaykitUrbanDef[] = [
  ...KAYKIT_TRAFFIC_LIGHTS,
  ...KAYKIT_TRASH,
  ...KAYKIT_BENCHES,
  ...KAYKIT_FIRE_HYDRANTS,
  ...KAYKIT_DUMPSTERS,
  ...KAYKIT_STREETLIGHTS,
];
