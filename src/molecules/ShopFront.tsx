import { Shop } from '@/atoms/Shop';
import type { SceneShop } from '@/types/osm';

interface ShopFrontProps {
  position: [number, number, number];
  shopType: SceneShop['type'];
  name: string;
}

/**
 * Shop front molecule: the awning/signage + future interactive elements.
 * Currently delegates to the Shop atom. Will be extended in the interaction thread
 * to add Html labels, hover effects, etc.
 */
export function ShopFront({ position, shopType, name }: ShopFrontProps) {
  return (
    <Shop position={position} shopType={shopType} name={name} />
  );
}
