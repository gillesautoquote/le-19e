import { useEffect, useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePlayerStore } from '@/store/playerStore';
import { KENNEY_CARS } from '@/constants/kenneyCars';
import { KENNEY_BOATS } from '@/constants/kenneyWatercraft';
import { initNPCs, tickNPCs, isNPCInitialized, getPedRoutes } from '@/systems/npcSystem';
import { initLeaves } from '@/systems/leafSystem';
import { initDust } from '@/systems/dustSystem';
import { initPigeons, tickPigeons, isPigeonsInitialized } from '@/systems/pigeonSystem';
import AnimatedCarInstances from '@/atoms/AnimatedCarInstances';
import BoatVariantInstances from '@/atoms/AnimatedBoatInstances';
import AnimatedBirds from '@/atoms/AnimatedBirds';
import AnimatedPedestrians from '@/atoms/AnimatedPedestrian';
import FallingLeaves from '@/atoms/FallingLeaves';
import DustParticles from '@/atoms/DustParticles';
import GroundPigeons from '@/atoms/GroundPigeons';
import type { SceneRoad, SceneWater, SceneTree } from '@/types/osm';

interface OSMAnimatedEntitiesProps {
  roads: SceneRoad[];
  waterways: SceneWater[];
  trees: SceneTree[];
}

export default memo(function OSMAnimatedEntities({
  roads,
  waterways,
  trees,
}: OSMAnimatedEntitiesProps) {
  const lastRoadsRef = useRef<SceneRoad[]>([]);
  const lastWaterwaysRef = useRef<SceneWater[]>([]);

  // (Re)init NPC system when streaming data changes
  useEffect(() => {
    const roadsChanged = roads !== lastRoadsRef.current;
    const waterChanged = waterways !== lastWaterwaysRef.current;

    if ((roadsChanged || waterChanged) && roads.length > 0) {
      lastRoadsRef.current = roads;
      lastWaterwaysRef.current = waterways;
      const [px, , pz] = usePlayerStore.getState().position;
      initNPCs(roads, waterways, px, pz);
      initLeaves(px, pz, trees);
      initDust(px, pz);
      initPigeons(getPedRoutes(), px, pz);
    }
  }, [roads, waterways, trees]);

  // Tick all NPCs every frame — parent useFrame runs before children
  useFrame((_, delta) => {
    if (!isNPCInitialized()) return;
    const [px, , pz] = usePlayerStore.getState().position;
    tickNPCs(delta, px, pz);
    if (isPigeonsInitialized()) tickPigeons(delta, px, pz);
  });

  return (
    <group>
      {/* Animated cars — one InstancedMesh group per Kenney variant */}
      {KENNEY_CARS.map((def, idx) => (
        <AnimatedCarInstances
          key={def.key}
          modelDef={def}
          variantIndex={idx}
        />
      ))}

      {/* Animated boats — one InstancedMesh group per Kenney watercraft */}
      {KENNEY_BOATS.map((def, idx) => (
        <BoatVariantInstances
          key={def.key}
          modelDef={def}
          variantIndex={idx}
        />
      ))}

      {/* Birds circling above the canal */}
      <AnimatedBirds />

      {/* Pedestrians walking on footways */}
      <AnimatedPedestrians />

      {/* Ground pigeons — scatter on player approach */}
      <GroundPigeons />

      {/* Ambient falling leaves */}
      <FallingLeaves />

      {/* Golden dust/pollen motes */}
      <DustParticles />
    </group>
  );
});
