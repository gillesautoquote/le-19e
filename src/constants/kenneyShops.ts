import type { KenneyBuildingDef } from '@/constants/kenneyBuildings';
import { KENNEY_COMMERCIAL } from '@/constants/kenneyBuildings';
import { EPOCH_A } from '@/constants/epochs';

export interface ShopModelMapping {
  model: KenneyBuildingDef;
  targetHeight: number;
  /** Hex colour used to tint the shop model (from epoch palette). */
  color: string;
  /** Whether to add an awning overlay. */
  awning: boolean;
}

const find = (key: string): KenneyBuildingDef =>
  KENNEY_COMMERCIAL.find((m) => m.key === key)!;

/** Map each OSM shop type to a Kenney commercial building + colour + awning. */
export const SHOP_MODELS: Record<string, ShopModelMapping> = {
  cafe:        { model: find('c'), targetHeight: 4.0, color: EPOCH_A.shopCafe, awning: true },
  restaurant:  { model: find('e'), targetHeight: 5.0, color: EPOCH_A.shopRestaurant, awning: true },
  bar:         { model: find('d'), targetHeight: 5.0, color: EPOCH_A.shopBar, awning: true },
  bakery:      { model: find('a'), targetHeight: 4.5, color: EPOCH_A.shopBakery, awning: true },
  pharmacy:    { model: find('b'), targetHeight: 5.0, color: EPOCH_A.shopPharmacy, awning: true },
  convenience: { model: find('k'), targetHeight: 5.0, color: EPOCH_A.shopConvenience, awning: false },
  cinema:      { model: find('j'), targetHeight: 6.0, color: EPOCH_A.shopCinema, awning: false },
  other:       { model: find('h'), targetHeight: 5.0, color: EPOCH_A.shopOther, awning: false },
};

/** Unique model paths used for shops (for preloading). */
export const SHOP_MODEL_PATHS: string[] = [
  ...new Set(Object.values(SHOP_MODELS).map((m) => m.model.path)),
];
