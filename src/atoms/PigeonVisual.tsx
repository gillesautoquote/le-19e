import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh as MeshType, DoubleSide } from 'three';
import { EPOCH_A } from '@/constants/epochs';
import { getPigeonGroups } from '@/systems/pigeonSystem';
import { createPigeonWing, createPigeonTail } from '@/utils/pigeonGeometry';

interface PigeonVisualProps {
  groupIndex: number;
  pigeonIndex: number;
}

const HALF_PI = Math.PI / 2;

export default memo(function PigeonVisual({
  groupIndex,
  pigeonIndex,
}: PigeonVisualProps) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftWingRef = useRef<MeshType>(null);
  const rightWingRef = useRef<MeshType>(null);
  const visibleRef = useRef(false);

  const leftWingGeo = useMemo(() => createPigeonWing(false), []);
  const rightWingGeo = useMemo(() => createPigeonWing(true), []);
  const tailGeo = useMemo(() => createPigeonTail(), []);

  useFrame(() => {
    const groups = getPigeonGroups();
    const group = groups[groupIndex];
    if (!group || !groupRef.current) return;

    const pigeon = group.pigeons[pigeonIndex];
    if (!pigeon) return;

    if (group.state === 'gone') {
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

    const worldX = group.centerX + pigeon.localX;
    const worldZ = group.centerZ + pigeon.localZ;
    let worldY = group.groundY;

    if (group.state === 'scattering') {
      worldY += pigeon.scatterVY * group.stateTimer;
    }

    groupRef.current.position.set(worldX, worldY, worldZ);
    groupRef.current.rotation.y = group.state === 'pecking'
      ? pigeon.wanderAngle
      : Math.atan2(pigeon.scatterVX, pigeon.scatterVZ);

    if (headRef.current) {
      headRef.current.position.y = 0.14 + pigeon.headY;
    }

    if (leftWingRef.current) leftWingRef.current.rotation.z = pigeon.wingAngle;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -pigeon.wingAngle;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Body */}
      <mesh castShadow scale={[0.11, 0.09, 0.17]}>
        <sphereGeometry args={[1, 5, 4]} />
        <meshLambertMaterial color={EPOCH_A.pigeonBody} flatShading />
      </mesh>
      {/* Head */}
      <group ref={headRef} position={[0, 0.14, 0.14]}>
        <mesh castShadow>
          <sphereGeometry args={[0.06, 4, 3]} />
          <meshLambertMaterial color={EPOCH_A.pigeonHead} flatShading />
        </mesh>
        {/* Beak */}
        <mesh position={[0, -0.015, 0.06]} rotation={[HALF_PI, 0, 0]}>
          <coneGeometry args={[0.016, 0.05, 3]} />
          <meshLambertMaterial color={EPOCH_A.lampPost} flatShading />
        </mesh>
      </group>
      {/* Tail fan */}
      <mesh position={[0, 0.02, -0.17]} geometry={tailGeo} castShadow>
        <meshLambertMaterial color={EPOCH_A.pigeonWing} flatShading side={DoubleSide} />
      </mesh>
      {/* Left wing */}
      <mesh ref={leftWingRef} position={[-0.1, 0.02, 0]} geometry={leftWingGeo} castShadow>
        <meshLambertMaterial color={EPOCH_A.pigeonWing} flatShading side={DoubleSide} />
      </mesh>
      {/* Right wing */}
      <mesh ref={rightWingRef} position={[0.1, 0.02, 0]} geometry={rightWingGeo} castShadow>
        <meshLambertMaterial color={EPOCH_A.pigeonWing} flatShading side={DoubleSide} />
      </mesh>
    </group>
  );
});
