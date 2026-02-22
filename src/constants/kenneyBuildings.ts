export interface KenneyBuildingDef {
  key: string;
  path: string;
  nativeWidth: number;
  nativeHeight: number;
  nativeDepth: number;
  sizeClass: 'small' | 'medium' | 'large';
}

// ─── Commercial kit (shops, offices) ────────────────────────────────

export const KENNEY_COMMERCIAL: KenneyBuildingDef[] = [
  { key: 'a', path: '/models/kenney/commercial/building-a.glb', nativeWidth: 0.884, nativeHeight: 1.293, nativeDepth: 0.940, sizeClass: 'small' },
  { key: 'b', path: '/models/kenney/commercial/building-b.glb', nativeWidth: 0.970, nativeHeight: 1.293, nativeDepth: 0.940, sizeClass: 'small' },
  { key: 'c', path: '/models/kenney/commercial/building-c.glb', nativeWidth: 0.884, nativeHeight: 0.893, nativeDepth: 1.090, sizeClass: 'small' },
  { key: 'd', path: '/models/kenney/commercial/building-d.glb', nativeWidth: 0.840, nativeHeight: 1.293, nativeDepth: 0.900, sizeClass: 'small' },
  { key: 'h', path: '/models/kenney/commercial/building-h.glb', nativeWidth: 0.884, nativeHeight: 1.293, nativeDepth: 1.008, sizeClass: 'small' },
  { key: 'e', path: '/models/kenney/commercial/building-e.glb', nativeWidth: 1.640, nativeHeight: 0.893, nativeDepth: 1.008, sizeClass: 'medium' },
  { key: 'f', path: '/models/kenney/commercial/building-f.glb', nativeWidth: 0.840, nativeHeight: 1.693, nativeDepth: 1.030, sizeClass: 'medium' },
  { key: 'g', path: '/models/kenney/commercial/building-g.glb', nativeWidth: 0.970, nativeHeight: 1.693, nativeDepth: 0.922, sizeClass: 'medium' },
  { key: 'i', path: '/models/kenney/commercial/building-i.glb', nativeWidth: 1.240, nativeHeight: 1.680, nativeDepth: 1.302, sizeClass: 'medium' },
  { key: 'k', path: '/models/kenney/commercial/building-k.glb', nativeWidth: 2.084, nativeHeight: 1.470, nativeDepth: 0.942, sizeClass: 'medium' },
  { key: 'j', path: '/models/kenney/commercial/building-j.glb', nativeWidth: 2.084, nativeHeight: 1.693, nativeDepth: 1.340, sizeClass: 'large' },
  { key: 'l', path: '/models/kenney/commercial/building-l.glb', nativeWidth: 1.370, nativeHeight: 2.270, nativeDepth: 1.402, sizeClass: 'large' },
  { key: 'm', path: '/models/kenney/commercial/building-m.glb', nativeWidth: 1.240, nativeHeight: 3.150, nativeDepth: 1.242, sizeClass: 'large' },
  { key: 'n', path: '/models/kenney/commercial/building-n.glb', nativeWidth: 2.320, nativeHeight: 2.480, nativeDepth: 1.820, sizeClass: 'large' },
];

// ─── Modular buildings kit (European residential) ───────────────────

export const KENNEY_RESIDENTIAL: KenneyBuildingDef[] = [
  { key: 'house-a', path: '/models/kenney/modular-buildings/building-sample-house-a.glb', nativeWidth: 2.000, nativeHeight: 2.144, nativeDepth: 2.000, sizeClass: 'small' },
  { key: 'house-b', path: '/models/kenney/modular-buildings/building-sample-house-b.glb', nativeWidth: 2.000, nativeHeight: 2.981, nativeDepth: 2.200, sizeClass: 'medium' },
  { key: 'house-c', path: '/models/kenney/modular-buildings/building-sample-house-c.glb', nativeWidth: 2.000, nativeHeight: 2.981, nativeDepth: 2.200, sizeClass: 'medium' },
  { key: 'tower-a', path: '/models/kenney/modular-buildings/building-sample-tower-a.glb', nativeWidth: 2.000, nativeHeight: 3.500, nativeDepth: 2.000, sizeClass: 'large' },
  { key: 'tower-b', path: '/models/kenney/modular-buildings/building-sample-tower-b.glb', nativeWidth: 2.000, nativeHeight: 2.888, nativeDepth: 2.000, sizeClass: 'medium' },
  { key: 'tower-c', path: '/models/kenney/modular-buildings/building-sample-tower-c.glb', nativeWidth: 2.000, nativeHeight: 4.138, nativeDepth: 2.000, sizeClass: 'large' },
  { key: 'tower-d', path: '/models/kenney/modular-buildings/building-sample-tower-d.glb', nativeWidth: 2.000, nativeHeight: 4.763, nativeDepth: 2.000, sizeClass: 'large' },
];

/** All building models combined (for InstancedMesh rendering). */
export const ALL_KENNEY_BUILDINGS: KenneyBuildingDef[] = [
  ...KENNEY_COMMERCIAL,
  ...KENNEY_RESIDENTIAL,
];

/** @deprecated Use KENNEY_COMMERCIAL instead */
export const KENNEY_BUILDINGS = KENNEY_COMMERCIAL;

