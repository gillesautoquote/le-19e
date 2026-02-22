import { useMemo, Suspense } from 'react';
import { Mesh } from 'three';
import { useGLTF } from '@react-three/drei';
import { EPOCH_A } from '@/constants/epochs';
import { MODEL_PATHS, ModelErrorBoundary } from '@/hooks/useAssets';
import type { SceneShop } from '@/types/osm';

interface ShopProps {
  position: [number, number, number];
  shopType: SceneShop['type'];
  name: string;
}

const SHOP_COLOR_MAP: Record<SceneShop['type'], string> = {
  cafe: EPOCH_A.shopCafe,
  restaurant: EPOCH_A.shopRestaurant,
  bar: EPOCH_A.shopBar,
  bakery: EPOCH_A.shopBakery,
  pharmacy: EPOCH_A.shopPharmacy,
  convenience: EPOCH_A.shopConvenience,
  cinema: EPOCH_A.shopCinema,
  other: EPOCH_A.shopOther,
};

// Kenney awning sits at roughly 1.2 units wide, 0.5 high
const AWNING_SCALE = 1.2;

// --- GLB awning version (using original Kenney materials) ---
function ShopModel({ position, shopType, name }: ShopProps) {
  const color = SHOP_COLOR_MAP[shopType] ?? EPOCH_A.shopOther;
  const { scene } = useGLTF(MODEL_PATHS.awning);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((node) => {
      if ((node as Mesh).isMesh) {
        const mesh = node as Mesh;
        mesh.castShadow = true;
      }
    });
    return c;
  }, [scene]);

  void name;

  return (
    <group position={position}>
      {/* Support poles */}
      <mesh position={[-0.5, 1.1, 0.3]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 2.2, 4]} />
        <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
      </mesh>
      <mesh position={[0.5, 1.1, 0.3]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 2.2, 4]} />
        <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
      </mesh>

      {/* Kenney awning model */}
      <group position={[0, 2.2, 0.15]}>
        <primitive object={clone} scale={[AWNING_SCALE, AWNING_SCALE, AWNING_SCALE]} />
      </group>

      {/* Sign board */}
      <mesh position={[0, 2.5, 0.02]}>
        <boxGeometry args={[1.0, 0.25, 0.04]} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}

// --- Procedural fallback ---
function ShopProcedural({ position, shopType, name }: ShopProps) {
  const color = SHOP_COLOR_MAP[shopType] ?? EPOCH_A.shopOther;

  const geo = useMemo(() => ({
    awning: [1.2, 0.06, 0.6] as [number, number, number],
    pole: [0.03, 0.03, 2.2, 4] as [number, number, number, number],
    sign: [1.0, 0.25, 0.04] as [number, number, number],
  }), []);

  void name;

  return (
    <group position={position}>
      {/* Support poles */}
      <mesh position={[-0.5, 1.1, 0.3]} castShadow>
        <cylinderGeometry args={geo.pole} />
        <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
      </mesh>
      <mesh position={[0.5, 1.1, 0.3]} castShadow>
        <cylinderGeometry args={geo.pole} />
        <meshLambertMaterial color={EPOCH_A.benchMetal} flatShading />
      </mesh>

      {/* Awning */}
      <mesh position={[0, 2.25, 0.15]} castShadow>
        <boxGeometry args={geo.awning} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      {/* Sign board */}
      <mesh position={[0, 2.5, 0.02]}>
        <boxGeometry args={geo.sign} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}

// --- Public Shop atom (GLB with fallback) ---
export function Shop(props: ShopProps) {
  const fallback = <ShopProcedural {...props} />;
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <ShopModel {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
