export interface KenneyCarDef {
  key: string;
  path: string;
  nativeLength: number;  // Z axis
  nativeWidth: number;   // X axis
  nativeHeight: number;  // Y axis
}

export const KENNEY_CARS: KenneyCarDef[] = [
  { key: 'sedan', path: '/models/kenney/cars/sedan.glb', nativeLength: 2.550, nativeWidth: 2.000, nativeHeight: 2.150 },
  { key: 'taxi', path: '/models/kenney/cars/taxi.glb', nativeLength: 2.750, nativeWidth: 2.000, nativeHeight: 2.350 },
  { key: 'delivery', path: '/models/kenney/cars/delivery.glb', nativeLength: 3.250, nativeWidth: 2.000, nativeHeight: 2.500 },
  { key: 'van', path: '/models/kenney/cars/van.glb', nativeLength: 2.750, nativeWidth: 2.000, nativeHeight: 2.150 },
  { key: 'suv', path: '/models/kenney/cars/suv.glb', nativeLength: 2.550, nativeWidth: 2.000, nativeHeight: 2.100 },
  { key: 'hatchback', path: '/models/kenney/cars/hatchback-sports.glb', nativeLength: 2.850, nativeWidth: 2.000, nativeHeight: 2.000 },
];
