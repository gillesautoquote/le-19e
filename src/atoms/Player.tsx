import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { EPOCH_A } from '@/constants/epochs';
import { PLAYER } from '@/constants/player';
import { usePlayerStore } from '@/store/playerStore';
import { useCameraStore } from '@/store/cameraStore';
import { updatePlayerMovement, computeKeyboardMovement } from '@/systems/playerSystem';
import { getKeys } from '@/systems/inputSystem';
import { ModelErrorBoundary } from '@/hooks/useAssets';
import MixamoCharacter from '@/atoms/MixamoCharacter';

// --- Character visual: procedural fallback ---
function CharacterProcedural() {
  return (
    <group>
      <mesh position={[0, PLAYER.bodyY, 0]} castShadow>
        <boxGeometry args={[PLAYER.bodyWidth, PLAYER.bodyHeight, PLAYER.bodyDepth]} />
        <meshLambertMaterial color={EPOCH_A.playerBody} flatShading />
      </mesh>
      <mesh position={[0, PLAYER.headY, 0]} castShadow>
        <boxGeometry args={[PLAYER.headSize, PLAYER.headSize, PLAYER.headSize]} />
        <meshLambertMaterial color={EPOCH_A.playerHead} flatShading />
      </mesh>
      <mesh position={[-PLAYER.legOffsetX, PLAYER.legY, 0]} castShadow>
        <boxGeometry args={[PLAYER.legWidth, PLAYER.legHeight, PLAYER.legDepth]} />
        <meshLambertMaterial color={EPOCH_A.playerLegs} flatShading />
      </mesh>
      <mesh position={[PLAYER.legOffsetX, PLAYER.legY, 0]} castShadow>
        <boxGeometry args={[PLAYER.legWidth, PLAYER.legHeight, PLAYER.legDepth]} />
        <meshLambertMaterial color={EPOCH_A.playerLegs} flatShading />
      </mesh>
    </group>
  );
}

// --- Player component (movement logic + visual) ---
export default function Player() {
  const groupRef = useRef<Group>(null);
  const walkTimeRef = useRef(0);
  const movingRef = useRef(false);
  const store = usePlayerStore;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const keys = getKeys();
    const turbo = keys.has('shift');
    const cameraTheta = useCameraStore.getState().theta;
    const kbMove = computeKeyboardMovement(
      groupRef.current.position.x,
      groupRef.current.position.z,
      keys,
      cameraTheta,
      delta,
      turbo
    );

    // Arrow key movement takes priority over click-to-move
    if (kbMove) {
      store.getState().stopMovement();
      movingRef.current = true;

      groupRef.current.position.set(kbMove.x, kbMove.y, kbMove.z);
      groupRef.current.rotation.y = kbMove.rotation;

      store.setState({
        position: [kbMove.x, kbMove.y, kbMove.z],
        rotation: kbMove.rotation,
      });
      return;
    }

    // Click-to-move fallback
    const { targetPosition } = store.getState();
    if (!targetPosition) {
      movingRef.current = false;
      return;
    }

    const result = updatePlayerMovement(
      {
        positionX: groupRef.current.position.x,
        positionY: groupRef.current.position.y,
        positionZ: groupRef.current.position.z,
        rotation: groupRef.current.rotation.y,
        isMoving: true,
        walkTime: walkTimeRef.current,
      },
      targetPosition[0],
      targetPosition[2],
      delta,
      turbo
    );

    movingRef.current = !result.arrived;
    groupRef.current.position.set(result.x, result.y, result.z);
    groupRef.current.rotation.y = result.rotation;
    walkTimeRef.current = result.walkTime;

    store.setState({
      position: [result.x, result.y, result.z],
      rotation: result.rotation,
    });

    if (result.arrived) {
      store.getState().stopMovement();
    }
  });

  const fallback = <CharacterProcedural />;

  return (
    <group ref={groupRef} position={[PLAYER.startX, 0, PLAYER.startZ]}>
      <ModelErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <MixamoCharacter movingRef={movingRef} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
}
