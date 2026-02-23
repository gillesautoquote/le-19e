import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Html } from '@react-three/drei';
import { Group, MathUtils } from 'three';
import { EPOCH_A } from '@/constants/epochs';
import { MULTIPLAYER } from '@/constants/multiplayer';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { useChatStore } from '@/store/chatStore';
import RemoteCharacter from '@/atoms/RemoteCharacter';

interface RemotePlayerProps {
  playerId: string;
  name: string;
  bodyColor: string;
  headColor: string;
  legsColor: string;
  initialX: number;
  initialZ: number;
  initialRotation: number;
}

/** Interpolate angle via shortest path */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

export default function RemotePlayer({
  playerId,
  name,
  bodyColor,
  headColor,
  legsColor,
  initialX,
  initialZ,
  initialRotation,
}: RemotePlayerProps) {
  const groupRef = useRef<Group>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch for new chat messages from this player
  useEffect(() => {
    const unsub = useChatStore.subscribe((state) => {
      const msgs = state.messages;
      if (msgs.length === 0) return;
      const latest = msgs[msgs.length - 1];
      if (latest.playerId === playerId && latest.playerId !== 'system') {
        setLastMessage(latest.text);
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = setTimeout(() => {
          setLastMessage(null);
        }, MULTIPLAYER.speechBubbleDuration);
      }
    });
    return () => {
      unsub();
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, [playerId]);

  // Interpolate position each frame via refs (no React setState)
  useFrame((_, delta) => {
    const buf = useMultiplayerStore.getState().interpolation.get(playerId);
    if (!buf || !groupRef.current) return;

    buf.elapsed += delta * 1000; // convert to ms
    const t = Math.min(buf.elapsed / buf.duration, 1);

    groupRef.current.position.x = MathUtils.lerp(buf.prevX, buf.targetX, t);
    groupRef.current.position.z = MathUtils.lerp(buf.prevZ, buf.targetZ, t);
    groupRef.current.rotation.y = lerpAngle(buf.prevRotation, buf.targetRotation, t);
  });

  return (
    <group ref={groupRef} position={[initialX, 0, initialZ]} rotation={[0, initialRotation, 0]}>
      <RemoteCharacter bodyColor={bodyColor} headColor={headColor} legsColor={legsColor} />

      {/* Name label */}
      <Billboard position={[0, MULTIPLAYER.nameLabelYOffset, 0]} follow>
        <Text
          fontSize={MULTIPLAYER.nameLabelFontSize}
          color={EPOCH_A.labelText}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor={EPOCH_A.labelOutline}
        >
          {name}
        </Text>
      </Billboard>

      {/* Speech bubble */}
      {lastMessage && (
        <Html
          position={[0, MULTIPLAYER.nameLabelYOffset + 0.5, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: EPOCH_A.chatBubbleBg,
            color: EPOCH_A.chatBubbleText,
            border: `1px solid ${EPOCH_A.chatBubbleBorder}`,
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '12px',
            maxWidth: '150px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textAlign: 'center',
            opacity: 0.95,
          }}>
            {lastMessage}
          </div>
        </Html>
      )}
    </group>
  );
}
