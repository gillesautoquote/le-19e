export interface KenneyBoatDef {
  key: string;
  path: string;
  nativeLength: number;  // Z axis (approx, will be measured)
  nativeWidth: number;   // X axis
  nativeHeight: number;  // Y axis
}

export const KENNEY_BOATS: KenneyBoatDef[] = [
  {
    key: 'house-a',
    path: '/models/kenney/watercraft/boat-house-a.glb',
    nativeLength: 4.64,
    nativeWidth: 2.68,
    nativeHeight: 2.17,
  },
  {
    key: 'house-b',
    path: '/models/kenney/watercraft/boat-house-b.glb',
    nativeLength: 5.55,
    nativeWidth: 2.68,
    nativeHeight: 2.20,
  },
  {
    key: 'tow',
    path: '/models/kenney/watercraft/boat-tow-a.glb',
    nativeLength: 6.12,
    nativeWidth: 2.88,
    nativeHeight: 3.33,
  },
  {
    key: 'row',
    path: '/models/kenney/watercraft/boat-row-large.glb',
    nativeLength: 2.85,
    nativeWidth: 1.43,
    nativeHeight: 0.64,
  },
];
