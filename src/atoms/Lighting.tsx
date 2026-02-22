import { EPOCH_A, EPOCH_B } from '@/constants/epochs';
import { LIGHTING } from '@/constants/world';
import { useWorldStore } from '@/store/worldStore';

export default function Lighting() {
  const epoch = useWorldStore((s) => s.epoch);
  const palette = epoch === 'A' ? EPOCH_A : EPOCH_B;

  return (
    <>
      {/* Soleil — lumière principale dorée */}
      <directionalLight
        position={[...LIGHTING.sunPosition]}
        intensity={LIGHTING.sunIntensity}
        color={palette.sunLight}
        castShadow
        shadow-mapSize-width={LIGHTING.shadowMapSize}
        shadow-mapSize-height={LIGHTING.shadowMapSize}
        shadow-camera-near={LIGHTING.shadowCameraNear}
        shadow-camera-far={LIGHTING.shadowCameraFar}
        shadow-camera-left={-LIGHTING.shadowCameraSize}
        shadow-camera-right={LIGHTING.shadowCameraSize}
        shadow-camera-top={LIGHTING.shadowCameraSize}
        shadow-camera-bottom={-LIGHTING.shadowCameraSize}
      />

      {/* Lumière ambiante douce — teinte bleutée de ciel */}
      <ambientLight
        intensity={LIGHTING.ambientIntensity}
        color={palette.ambientLight}
      />

      {/* Hemisphere — teinte différente haut/bas */}
      <hemisphereLight
        args={[palette.sky, EPOCH_B.sky, LIGHTING.hemisphereIntensity]}
      />
    </>
  );
}
