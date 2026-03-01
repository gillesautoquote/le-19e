export interface KaykitCarDef {
  key: string;
  path: string;
  nativeLength: number; // Z axis (metres)
  nativeHeight: number; // Y axis (metres)
  scale: number;        // uniform scale to reach realistic size (~4m length)
}

/** KayKit City Builder static cars for parked vehicles along roads. */
export const KAYKIT_STATIC_CARS: KaykitCarDef[] = [
  {
    key: 'sedan',
    path: '/models/kaykit/cars/car_sedan.glb',
    nativeLength: 0.938,
    nativeHeight: 0.380,
    scale: 4.5, // 0.938 * 4.5 ≈ 4.2m
  },
  {
    key: 'hatchback',
    path: '/models/kaykit/cars/car_hatchback.glb',
    nativeLength: 0.806,
    nativeHeight: 0.380,
    scale: 4.8, // 0.806 * 4.8 ≈ 3.9m
  },
  {
    key: 'taxi',
    path: '/models/kaykit/cars/car_taxi.glb',
    nativeLength: 0.938,
    nativeHeight: 0.446,
    scale: 4.5, // 0.938 * 4.5 ≈ 4.2m
  },
  {
    key: 'stationwagon',
    path: '/models/kaykit/cars/car_stationwagon.glb',
    nativeLength: 0.938,
    nativeHeight: 0.380,
    scale: 4.8, // 0.938 * 4.8 ≈ 4.5m
  },
  {
    key: 'police',
    path: '/models/kaykit/cars/car_police.glb',
    nativeLength: 0.938,
    nativeHeight: 0.424,
    scale: 4.5, // 0.938 * 4.5 ≈ 4.2m
  },
];
