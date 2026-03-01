import { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { PLAYER } from '@/constants/player';
import { usePlayerStore } from '@/store/playerStore';
import { useCameraStore } from '@/store/cameraStore';
import { updatePlayerMovement, computeKeyboardMovement, lerpAngle, getSurfaceHeight } from '@/systems/playerSystem';
import { getKeys, isChatFocused } from '@/systems/inputSystem';
import { useEditorStore } from '@/store/editorStore';
import { isHeightmapLoaded } from '@/systems/terrainSystem';
import { broadcastPosition } from '@/systems/networkSystem';
import { ModelErrorBoundary } from '@/hooks/useAssets';
import MixamoCharacter from '@/atoms/MixamoCharacter';
import CharacterProcedural from '@/atoms/CharacterProcedural';
export default function Player() {
  const groupRef = useRef<Group>(null);
  const walkTimeRef = useRef(0);
  const movingRef = useRef(false);
  const terrainInitRef = useRef(false);
  const store = usePlayerStore;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Snap to terrain height once heightmap is available
    if (!terrainInitRef.current && isHeightmapLoaded()) {
      terrainInitRef.current = true;
      const pos = groupRef.current.position;
      const y = getSurfaceHeight(pos.x, pos.z);
      pos.y = y;
      store.setState({ position: [pos.x, y, pos.z] });
    }

    // Skip movement input when chat is focused
    if (isChatFocused()) {
      movingRef.current = false;
      return;
    }

    // Skip movement when editor is active
    if (useEditorStore.getState().enabled) {
      movingRef.current = false;
      return;
    }

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

    // WASD/ZQSD/Arrow movement takes priority over click-to-move
    if (kbMove) {
      store.getState().stopMovement();
      movingRef.current = true;

      groupRef.current.position.set(kbMove.x, kbMove.y, kbMove.z);
      const smoothedRotation = lerpAngle(
        groupRef.current.rotation.y,
        kbMove.rotation,
        delta * PLAYER.rotationLerpSpeed,
      );
      groupRef.current.rotation.y = smoothedRotation;

      store.setState({
        position: [kbMove.x, kbMove.y, kbMove.z],
        rotation: smoothedRotation,
        isMoving: true,
      });
      broadcastPosition(kbMove.x, kbMove.z, smoothedRotation, 1);
      return;
    }

    // No keyboard input → mark not moving (for auto-follow camera)
    const { targetPosition } = store.getState();
    if (!targetPosition) {
      movingRef.current = false;
      store.setState({ isMoving: false });
      return;
    }

    // Click-to-move fallback
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
    const smoothedRot = lerpAngle(
      groupRef.current.rotation.y,
      result.rotation,
      delta * PLAYER.rotationLerpSpeed,
    );
    groupRef.current.rotation.y = smoothedRot;
    walkTimeRef.current = result.walkTime;

    store.setState({
      position: [result.x, result.y, result.z],
      rotation: smoothedRot,
      isMoving: !result.arrived,
    });
    broadcastPosition(result.x, result.z, smoothedRot, result.arrived ? 0 : 1);

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
