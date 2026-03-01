import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight } from 'three';
import { EPOCH_A, EPOCH_B } from '@/constants/epochs';
import { LIGHTING } from '@/constants/world';
import { useWorldStore } from '@/store/worldStore';
import { usePlayerStore } from '@/store/playerStore';

export default function Lighting() {
  const epoch = useWorldStore((s) => s.epoch);
  const palette = epoch === 'A' ? EPOCH_A : EPOCH_B;
  const sunRef = useRef<DirectionalLight>(null);

  // Shadow camera follows player position each frame
  useFrame(() => {
    const light = sunRef.current;
    if (!light) return;

    const [px, , pz] = usePlayerStore.getState().position;

    // Keep same sun direction offset, centered on player
    light.position.set(
      px + LIGHTING.sunPosition[0],
      LIGHTING.sunPosition[1],
      pz + LIGHTING.sunPosition[2],
    );

    // Shadow target follows player
    light.target.position.set(px, 0, pz);
    light.target.updateMatrixWorld();
  });

  return (
    <>
      {/* Soleil — lumière principale dorée */}
      <directionalLight
        ref={sunRef}
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
        shadow-radius={LIGHTING.shadowRadius}
        shadow-bias={LIGHTING.shadowBias}
      >
        <object3D attach="target" />
      </directionalLight>

      {/* Fill light — golden hour, côté opposé au soleil */}
      <directionalLight
        position={[...LIGHTING.fillLightPosition]}
        intensity={LIGHTING.fillLightIntensity}
        color={palette.sunLightSecondary}
      />

      {/* Lumière ambiante douce — teinte dorée golden hour */}
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
