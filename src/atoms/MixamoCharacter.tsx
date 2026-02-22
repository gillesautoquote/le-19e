import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, Mesh, AnimationAction, AnimationClip, Box3 } from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MODEL_PATHS } from '@/hooks/useAssets';

const CHARACTER_HEIGHT = 1.8;
const CROSSFADE_DURATION = 0.25;

interface MixamoCharacterProps {
  movingRef: React.RefObject<boolean>;
}

export default function MixamoCharacter({ movingRef }: MixamoCharacterProps) {
  const groupRef = useRef<Group>(null);
  const currentRef = useRef<AnimationAction | null>(null);

  const idleGltf = useGLTF(MODEL_PATHS.characterIdle);
  const walkGltf = useGLTF(MODEL_PATHS.characterWalk);

  // SkeletonUtils.clone preserves skin↔bone bindings (Object3D.clone does NOT)
  const scene = useMemo(() => {
    const c = skeletonClone(idleGltf.scene);
    c.traverse((node) => {
      if ((node as Mesh).isMesh) {
        (node as Mesh).castShadow = true;
      }
    });
    return c;
  }, [idleGltf.scene]);

  const scale = useMemo(() => {
    const box = new Box3().setFromObject(idleGltf.scene);
    const nativeHeight = box.max.y - box.min.y;
    return CHARACTER_HEIGHT / (nativeHeight || 1.7);
  }, [idleGltf.scene]);

  // Rename clips so idle and walk are distinguishable
  const allClips = useMemo(() => {
    const idleClip = idleGltf.animations[0]?.clone() as AnimationClip | undefined;
    const walkClip = walkGltf.animations[0]?.clone() as AnimationClip | undefined;
    const clips: AnimationClip[] = [];
    if (idleClip) {
      idleClip.name = 'idle';
      clips.push(idleClip);
    }
    if (walkClip) {
      walkClip.name = 'walk';
      clips.push(walkClip);
    }
    return clips;
  }, [idleGltf.animations, walkGltf.animations]);

  const { actions } = useAnimations(allClips, groupRef);

  // Start idle animation
  useEffect(() => {
    const idle = actions['idle'];
    if (idle) {
      idle.reset().play();
      currentRef.current = idle;
    }
  }, [actions]);

  // Switch between idle / walk each frame
  useFrame(() => {
    const moving = movingRef.current ?? false;
    const targetName = moving ? 'walk' : 'idle';
    const target = actions[targetName];
    const current = currentRef.current;

    if (target && current !== target) {
      target.reset().fadeIn(CROSSFADE_DURATION).play();
      current?.fadeOut(CROSSFADE_DURATION);
      currentRef.current = target;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[scale, scale, scale]} />
    </group>
  );
}
