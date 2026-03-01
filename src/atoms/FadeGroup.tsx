import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Material } from 'three';

interface FadeGroupProps {
  dataVersion: number;
  duration?: number;
  children: ReactNode;
}

interface FadeState {
  version: number;
  progress: number;
}

function setGroupOpacity(group: Group, opacity: number): void {
  group.traverse((node) => {
    if (!(node as Mesh).isMesh) return;
    const mat = (node as Mesh).material;
    if (!mat) return;

    const materials = Array.isArray(mat) ? mat : [mat];
    for (const m of materials) {
      (m as Material).transparent = opacity < 1;
      (m as Material).opacity = opacity;
    }
  });
}

export default function FadeGroup({
  dataVersion,
  duration = 0.6,
  children,
}: FadeGroupProps) {
  const groupRef = useRef<Group>(null);
  const fadeRef = useRef<FadeState>({ version: -1, progress: 1 });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const fade = fadeRef.current;

    // Detect data version change → start new fade
    if (dataVersion !== fade.version) {
      fade.version = dataVersion;
      fade.progress = 0;
    }

    // Already fully opaque — nothing to do
    if (fade.progress >= 1) return;

    fade.progress = Math.min(1, fade.progress + delta / duration);
    setGroupOpacity(groupRef.current, fade.progress);
  });

  return <group ref={groupRef}>{children}</group>;
}
