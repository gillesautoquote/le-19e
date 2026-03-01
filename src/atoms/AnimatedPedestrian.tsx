import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh as MeshType } from 'three';
import { EPOCH_A } from '@/constants/epochs';
import { NPC } from '@/constants/npc';
import { getAnimatedPedestrians } from '@/systems/npcSystem';
import { getTerrainHeight } from '@/systems/terrainSystem';
import { getRoadGradeHeight } from '@/systems/roadGradeSystem';

// ─── Body color variants ────────────────────────────────────────

const BODY_COLORS = [
  EPOCH_A.npcBodyA,
  EPOCH_A.npcBodyB,
  EPOCH_A.npcBodyC,
  EPOCH_A.npcBodyD,
] as const;

// ─── Single pedestrian component ────────────────────────────────

interface PedestrianProps {
  index: number;
}

const Pedestrian = memo(function Pedestrian({ index }: PedestrianProps) {
  const groupRef = useRef<Group>(null);
  const leftLegRef = useRef<MeshType>(null);
  const rightLegRef = useRef<MeshType>(null);
  const visibleRef = useRef(false);

  const bodyColor = useMemo(() => {
    const peds = getAnimatedPedestrians();
    const ped = peds[index];
    return BODY_COLORS[(ped?.colorVariant ?? index) % BODY_COLORS.length];
  }, [index]);

  useFrame(() => {
    const peds = getAnimatedPedestrians();
    const ped = peds[index];
    if (!groupRef.current) return;

    if (!ped || !ped.alive) {
      if (visibleRef.current) {
        groupRef.current.visible = false;
        visibleRef.current = false;
      }
      return;
    }

    if (!visibleRef.current) {
      groupRef.current.visible = true;
      visibleRef.current = true;
    }

    const y = Math.max(getTerrainHeight(ped.x, ped.z), getRoadGradeHeight(ped.x, ped.z));
    groupRef.current.position.set(ped.x, y, ped.z);
    groupRef.current.rotation.y = ped.rotationY;

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = ped.leftLegAngle;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = ped.rightLegAngle;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Body */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.35]} />
        <meshLambertMaterial color={bodyColor} flatShading />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshLambertMaterial color={EPOCH_A.npcHead} flatShading />
      </mesh>
      {/* Left leg — pivot at hip */}
      <group position={[-0.12, 0.85, 0]}>
        <mesh ref={leftLegRef} position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshLambertMaterial color={EPOCH_A.npcLegs} flatShading />
        </mesh>
      </group>
      {/* Right leg */}
      <group position={[0.12, 0.85, 0]}>
        <mesh ref={rightLegRef} position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshLambertMaterial color={EPOCH_A.npcLegs} flatShading />
        </mesh>
      </group>
    </group>
  );
});

// ─── Pedestrians container ──────────────────────────────────────

export default memo(function AnimatedPedestrians() {
  const indices = useMemo(
    () => Array.from({ length: NPC.maxPedestrians }, (_, i) => i),
    [],
  );

  return (
    <group>
      {indices.map((i) => (
        <Pedestrian key={`ped-${i}`} index={i} />
      ))}
    </group>
  );
});
