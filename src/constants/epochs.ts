// Epoch A — Paris actuel (chaud, lumineux)
export const EPOCH_A = {
  sky: '#87CEEB',
  water: '#4ECDC4',
  waterDeep: '#1A6B5A',
  building_residential: '#E8D5B7',
  building_commercial: '#C4A882',
  building_terracotta: '#C4785A',
  building_sandstone: '#D4A574',
  building_cream: '#E0C8A8',
  vegetation: '#7BC67E',
  trunk: '#8B5E3C',
  ground: '#C8B89A',
  groundEdge: '#B0A890',
  terrainHigh: '#C4B896',
  fog: '#E8E0D0',
  sunLight: '#FFF4E0',
  playerBody: '#3498DB',
  playerHead: '#F5CBA7',
  playerLegs: '#2C3E50',
  clickIndicator: '#FFFFFF',
  minimapPlayer: '#E74C3C',
  minimapPlayerStroke: '#FFFFFF',

  // Urban furniture
  benchWood: '#A0724A',
  benchMetal: '#5C5C5C',
  lampPost: '#3A3A3A',
  lampHead: '#FFE4A0',
  wasteBin: '#2E5E2E',
  fountainWallace: '#2E5E4E',
  fountainStandard: '#6B7B8B',
  velibStation: '#7DBE42',
  velibBike: '#4A4A4A',
  busShelter: '#C0C0C0',
  busShelterGlass: '#B0D4E8',
  busSign: '#6B3A7D',
  trafficLightPole: '#4A4A4A',
  trafficLightRed: '#E04040',
  trafficLightAmber: '#E0A020',
  trafficLightGreen: '#40B040',
  bargeHull: '#5C4033',
  bargeCabin: '#E8D5B7',
  bargeTour: '#4A7B9D',
  lockWood: '#4A3520',
  lockMetal: '#6B6B6B',

  // Shop fronts
  shopCafe: '#8B5E3C',
  shopRestaurant: '#C44040',
  shopBar: '#2C3E50',
  shopBakery: '#D4A054',
  shopPharmacy: '#00A86B',
  shopConvenience: '#4A7B9D',
  shopCinema: '#C44040',
  shopOther: '#7B7B7B',

  // Road surfaces
  roadPrimary: '#606060',
  roadSecondary: '#707068',
  roadTertiary: '#808075',
  roadResidential: '#908880',
  roadFootway: '#A89888',
  roadCycleway: '#5A8A5A',

  // Lighting
  ambientLight: '#E0E8FF',
  sunLightColor: '#FFF5E0',

  // NPC colors
  npcBodyA: '#3A6B8C',
  npcBodyB: '#8C3A3A',
  npcBodyC: '#3A8C5A',
  npcBodyD: '#8C7A3A',
  npcHead: '#F0C8A0',
  npcLegs: '#2C3E50',
  birdBody: '#4A4A4A',
  birdWing: '#6A6A6A',

  // Text labels (3D billboards)
  labelText: '#1A1A1A',
  labelOutline: '#FFFFFF',
} as const;

// Epoch B — Paris post-apo (froid, désaturé)
export const EPOCH_B = {
  sky: '#8B7355',
  water: '#2C3E2D',
  waterDeep: '#1A2B1A',
  building_residential: '#6B6B5E',
  building_commercial: '#5A5A4E',
  building_terracotta: '#5E4A3A',
  building_sandstone: '#5A5044',
  building_cream: '#6B6B5E',
  vegetation: '#4A6741',
  trunk: '#5A4030',
  ground: '#4A4A3E',
  groundEdge: '#3E3E35',
  terrainHigh: '#5A5A4E',
  fog: '#3D3D35',
  sunLight: '#C8B89A',
  playerBody: '#2C5F7C',
  playerHead: '#C8A882',
  playerLegs: '#1A2830',
  clickIndicator: '#CCCCCC',
  minimapPlayer: '#C44040',
  minimapPlayerStroke: '#CCCCCC',

  // Urban furniture
  benchWood: '#5A4030',
  benchMetal: '#3E3E3E',
  lampPost: '#2A2A2A',
  lampHead: '#8B7355',
  wasteBin: '#2A3A2A',
  fountainWallace: '#1E3E2E',
  fountainStandard: '#4A5A6A',
  velibStation: '#4A6030',
  velibBike: '#3A3A3A',
  busShelter: '#6B6B6B',
  busShelterGlass: '#5A6A7A',
  busSign: '#3A2A4A',
  trafficLightPole: '#3A3A3A',
  trafficLightRed: '#8A3030',
  trafficLightAmber: '#8A6A20',
  trafficLightGreen: '#308030',
  bargeHull: '#3A2A1A',
  bargeCabin: '#6B6B5E',
  bargeTour: '#3A5A6A',
  lockWood: '#2A1A10',
  lockMetal: '#4A4A4A',

  // Shop fronts
  shopCafe: '#5A3A2A',
  shopRestaurant: '#6A2A2A',
  shopBar: '#1A2830',
  shopBakery: '#6A5030',
  shopPharmacy: '#005A3A',
  shopConvenience: '#3A5A6A',
  shopCinema: '#6A2A2A',
  shopOther: '#4A4A4A',

  // Road surfaces
  roadPrimary: '#4A4A3E',
  roadSecondary: '#505040',
  roadTertiary: '#555548',
  roadResidential: '#5A5A4E',
  roadFootway: '#606050',
  roadCycleway: '#3A5030',

  // Lighting
  ambientLight: '#B0B8C8',
  sunLightColor: '#C8B89A',

  // NPC colors
  npcBodyA: '#2A4A5A',
  npcBodyB: '#5A2A2A',
  npcBodyC: '#2A5A3A',
  npcBodyD: '#5A4A2A',
  npcHead: '#A08A70',
  npcLegs: '#1A2830',
  birdBody: '#3A3A3A',
  birdWing: '#4A4A4A',

  // Text labels (3D billboards)
  labelText: '#3A3A3A',
  labelOutline: '#CCCCCC',
} as const;

export type EpochPalette = typeof EPOCH_A;

export const BUILDING_COLORS_KEYS = [
  'building_residential',
  'building_commercial',
  'building_terracotta',
  'building_sandstone',
  'building_cream',
] as const;
