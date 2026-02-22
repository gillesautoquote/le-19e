import { useEffect, useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePlayerStore } from '@/store/playerStore';
import { KENNEY_CARS } from '@/constants/kenneyCars';
import { KENNEY_BOATS } from '@/constants/kenneyWatercraft';
import { initNPCs, tickNPCs, isNPCInitialized } from '@/systems/npcSystem';
import AnimatedCarInstances from '@/atoms/AnimatedCarInstances';
import BoatVariantInstances from '@/atoms/AnimatedBoatInstances';
import AnimatedBirds from '@/atoms/AnimatedBirds';
import AnimatedPedestrians from '@/atoms/AnimatedPedestrian';
import type { SceneRoad, SceneWater } from '@/types/osm';

interface OSMAnimatedEntitiesProps {
  roads: SceneRoad[];
  waterways: SceneWater[];
}

export default memo(function OSMAnimatedEntities({
  roads,
  waterways,
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
    }
  }, [roads, waterways]);

  // Tick all NPCs every frame — parent useFrame runs before children
  useFrame((_, delta) => {
    if (!isNPCInitialized()) return;
    const [px, , pz] = usePlayerStore.getState().position;
    tickNPCs(delta, px, pz);
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
    </group>
  );
});
