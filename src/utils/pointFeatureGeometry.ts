import {
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  Float32BufferAttribute,
  Color,
  BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EPOCH_A } from '@/constants/epochs';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type {
  SceneFountain,
  SceneVelib,
  SceneBusStop,
  SceneTrafficLight,
  SceneShop,
  SceneBarge,
  SceneLock,
  SceneWasteBin,
} from '@/types/osm';

function colorize(geo: BufferGeometry, color: Color): void {
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
}

interface PointFeatureData {
  fountains: SceneFountain[];
  velibs: SceneVelib[];
  busStops: SceneBusStop[];
  trafficLights: SceneTrafficLight[];
  shops: SceneShop[];
  barges: SceneBarge[];
  locks: SceneLock[];
  wasteBins: SceneWasteBin[];
}

export function buildPointFeatureGeometry(data: PointFeatureData): BufferGeometry | null {
  const { fountains, velibs, busStops, trafficLights, shops, barges, locks, wasteBins } = data;
  const geos: BufferGeometry[] = [];

  const wallaceColor = new Color(EPOCH_A.fountainWallace);
  const standardFountainColor = new Color(EPOCH_A.fountainStandard);
  const velibColor = new Color(EPOCH_A.velibStation);
  const shelterColor = new Color(EPOCH_A.busShelter);
  const poleColor = new Color(EPOCH_A.trafficLightPole);
  const redLight = new Color(EPOCH_A.trafficLightRed);
  const amberLight = new Color(EPOCH_A.trafficLightAmber);
  const greenLight = new Color(EPOCH_A.trafficLightGreen);
  const bargeHullColor = new Color(EPOCH_A.bargeHull);
  const bargeTourColor = new Color(EPOCH_A.bargeTour);
  const lockColor = new Color(EPOCH_A.lockMetal);
  const binColor = new Color(EPOCH_A.wasteBin);
  const shopColors: Record<string, Color> = {
    cafe: new Color(EPOCH_A.shopCafe),
    restaurant: new Color(EPOCH_A.shopRestaurant),
    bar: new Color(EPOCH_A.shopBar),
    bakery: new Color(EPOCH_A.shopBakery),
    pharmacy: new Color(EPOCH_A.shopPharmacy),
    convenience: new Color(EPOCH_A.shopConvenience),
    cinema: new Color(EPOCH_A.shopCinema),
    other: new Color(EPOCH_A.shopOther),
  };

  // Fountains — cylinder basin
  for (const f of fountains) {
    const [x, z] = f.position;
    const ty = getTerrainHeight(x, z);
    const color = f.type === 'wallace' ? wallaceColor : standardFountainColor;
    const geo = new CylinderGeometry(0.6, 0.6, 1.0, 8);
    geo.translate(x, ty + 0.5, z);
    colorize(geo, color);
    geos.push(geo);
  }

  // Vélib stations — box borne
  for (const v of velibs) {
    const [x, z] = v.position;
    const ty = getTerrainHeight(x, z);
    const geo = new BoxGeometry(1.5, 1.2, 0.4);
    geo.translate(x, ty + 0.6, z);
    colorize(geo, velibColor);
    geos.push(geo);
  }

  // Bus stops — box shelter
  for (const b of busStops) {
    const [x, z] = b.position;
    const ty = getTerrainHeight(x, z);
    const geo = new BoxGeometry(2.0, 2.5, 0.5);
    geo.translate(x, ty + 1.25, z);
    colorize(geo, shelterColor);
    geos.push(geo);
  }

  // Traffic lights — pole + 3 light spheres
  for (const t of trafficLights) {
    const [x, z] = t.position;
    const ty = getTerrainHeight(x, z);

    const pole = new CylinderGeometry(0.06, 0.06, 3.5, 6);
    pole.translate(x, ty + 1.75, z);
    colorize(pole, poleColor);
    geos.push(pole);

    const r = new SphereGeometry(0.1, 6, 4);
    r.translate(x, ty + 3.4, z);
    colorize(r, redLight);
    geos.push(r);

    const a = new SphereGeometry(0.1, 6, 4);
    a.translate(x, ty + 3.15, z);
    colorize(a, amberLight);
    geos.push(a);

    const g = new SphereGeometry(0.1, 6, 4);
    g.translate(x, ty + 2.9, z);
    colorize(g, greenLight);
    geos.push(g);
  }

  // Barges — box hull on water
  for (const b of barges) {
    const [x, z] = b.position;
    const color = b.isTourBoat ? bargeTourColor : bargeHullColor;
    const geo = new BoxGeometry(b.length, 1.5, 2.5);
    geo.translate(x, -0.05, z);
    colorize(geo, color);
    geos.push(geo);
  }

  // Locks — box gate (near water, keep near water level)
  for (const l of locks) {
    const [x, z] = l.position;
    const geo = new BoxGeometry(4.0, 1.5, 1.0);
    geo.translate(x, 0.75, z);
    colorize(geo, lockColor);
    geos.push(geo);
  }

  // Shops — small box storefront
  for (const s of shops) {
    const [x, z] = s.position;
    const ty = getTerrainHeight(x, z);
    const color = shopColors[s.type] ?? shopColors.other;
    const geo = new BoxGeometry(2.0, 3.0, 1.0);
    geo.translate(x, ty + 1.5, z);
    colorize(geo, color);
    geos.push(geo);
  }

  // Waste bins — small cylinder
  for (const w of wasteBins) {
    const [x, z] = w.position;
    const ty = getTerrainHeight(x, z);
    const geo = new CylinderGeometry(0.25, 0.25, 0.8, 6);
    geo.translate(x, ty + 0.4, z);
    colorize(geo, binColor);
    geos.push(geo);
  }

  if (geos.length === 0) return null;
  return mergeGeometries(geos, false);
}
