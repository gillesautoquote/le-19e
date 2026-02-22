import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Group,
  Mesh as MeshType,
  BufferGeometry,
  Float32BufferAttribute,
  DoubleSide,
} from 'three';
import { EPOCH_A } from '@/constants/epochs';
import { NPC } from '@/constants/npc';
import { getAnimatedBirds } from '@/systems/npcSystem';

// ─── Wing geometry (shared, created once) ───────────────────────

function createWingGeometry(mirror: boolean): BufferGeometry {
  const sign = mirror ? 1 : -1;
  const geo = new BufferGeometry();
  // Triangle: base at body, tip outward
  const vertices = new Float32Array([
    0, 0, 0.15,
    0, 0, -0.15,
    sign * 0.5, 0.08, 0,
  ]);
  geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

// ─── Single bird component ──────────────────────────────────────

interface BirdProps {
  index: number;
}

const Bird = memo(function Bird({ index }: BirdProps) {
  const groupRef = useRef<Group>(null);
  const leftWingRef = useRef<MeshType>(null);
  const rightWingRef = useRef<MeshType>(null);

  const leftWingGeo = useMemo(() => createWingGeometry(false), []);
  const rightWingGeo = useMemo(() => createWingGeometry(true), []);

  useFrame(() => {
    const allBirds = getAnimatedBirds();
    const bird = allBirds[index];
    if (!bird || !groupRef.current) return;

    groupRef.current.position.set(bird.x, bird.altitude, bird.z);
    // Face direction of travel (tangent to circle)
    groupRef.current.rotation.y = bird.angle + Math.PI / 2;

    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = bird.wingAngle;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = -bird.wingAngle;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.1, 0.4]} />
        <meshLambertMaterial color={EPOCH_A.birdBody} flatShading />
      </mesh>
      {/* Left wing */}
      <mesh
        ref={leftWingRef}
        position={[-0.08, 0, 0]}
        geometry={leftWingGeo}
        castShadow
      >
        <meshLambertMaterial
          color={EPOCH_A.birdWing}
          flatShading
          side={DoubleSide}
        />
      </mesh>
      {/* Right wing */}
      <mesh
        ref={rightWingRef}
        position={[0.08, 0, 0]}
        geometry={rightWingGeo}
        castShadow
      >
        <meshLambertMaterial
          color={EPOCH_A.birdWing}
          flatShading
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
});

// ─── Birds container ────────────────────────────────────────────

export default memo(function AnimatedBirds() {
  const birdIndices = useMemo(
    () => Array.from({ length: NPC.birdCount }, (_, i) => i),
    [],
  );

  return (
    <group>
      {birdIndices.map((i) => (
        <Bird key={`bird-${i}`} index={i} />
      ))}
    </group>
  );
});
