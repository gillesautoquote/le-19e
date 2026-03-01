import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, ShaderMaterial, DoubleSide } from 'three';
import { EPOCH_A, EPOCH_B } from '@/constants/epochs';
import { useWorldStore } from '@/store/worldStore';
import { WORLD } from '@/constants/world';
import { WATER_VERTEX, WATER_FRAGMENT } from '@/utils/waterShaders';
import { buildWaterRibbon } from '@/utils/waterRibbon';
import { getTerrainHeight } from '@/systems/terrainSystem';
import type { SceneWater } from '@/types/osm';

// ─── Component ──────────────────────────────────────────────────

interface WaterProps {
  waterways?: SceneWater[];
}

export default memo(function Water({ waterways }: WaterProps) {
  const materialRef = useRef<ShaderMaterial>(null);

  const epoch = useWorldStore((s) => s.epoch);
  const palette = epoch === 'A' ? EPOCH_A : EPOCH_B;
  const opacity = epoch === 'A' ? 0.85 : 0.92;

  const targetColor = useMemo(() => new Color(palette.water), [palette.water]);
  const targetDeepColor = useMemo(() => new Color(palette.waterDeep), [palette.waterDeep]);
  const targetSkyColor = useMemo(() => new Color(palette.sky), [palette.sky]);

  // Build ribbon geometry from real waterway data
  const ribbonGeometry = useMemo(() => {
    if (!waterways || waterways.length === 0) return null;
    return buildWaterRibbon(waterways);
  }, [waterways]);

  // Compute water Y: terrain height minus canal depth (water sits inside trench)
  const waterY = useMemo(() => {
    if (!waterways || waterways.length === 0) return 0;
    const pts = waterways[0].points;
    const mid = pts[Math.floor(pts.length / 2)];
    return getTerrainHeight(mid[0], mid[1]) - WORLD.canalWaterDepth;
  }, [waterways]);

  const shaderArgs = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(EPOCH_A.water) },
      uDeepColor: { value: new Color(EPOCH_A.waterDeep) },
      uOpacity: { value: 0.85 },
      uCameraPosition: { value: [0, 25, 55] },
      uSkyColor: { value: new Color(EPOCH_A.sky) },
    },
    vertexShader: WATER_VERTEX,
    fragmentShader: WATER_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  }), []);

  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    mat.uniforms.uTime.value += delta;

    // Lerp colors toward target epoch
    mat.uniforms.uColor.value.lerp(targetColor, delta * 2);
    mat.uniforms.uDeepColor.value.lerp(targetDeepColor, delta * 2);
    mat.uniforms.uOpacity.value += (opacity - mat.uniforms.uOpacity.value) * delta * 2;
    mat.uniforms.uSkyColor.value.lerp(targetSkyColor, delta * 2);

    // Update camera position for fresnel
    const cam = state.camera.position;
    mat.uniforms.uCameraPosition.value = [cam.x, cam.y, cam.z];
  });

  if (!ribbonGeometry) return null;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, waterY, 0]}
      geometry={ribbonGeometry}
    >
      <shaderMaterial ref={materialRef} args={[shaderArgs]} />
    </mesh>
  );
});
