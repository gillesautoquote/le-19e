import { useEffect, type MutableRefObject } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import { usePlayerStore } from '@/store/playerStore';
import { useEditorStore } from '@/store/editorStore';
import { getSurfaceHeight } from '@/systems/playerSystem';

const _raycaster = new Raycaster();
const _mouse = new Vector2();
const _groundPlane = new Plane(new Vector3(0, 1, 0), 0);
const _hitPoint = new Vector3();

interface ClickIndicatorData {
  position: [number, number, number];
  time: number;
}

/** Hook that sets up click-to-move on the canvas ground plane. */
export function useClickToMove(
  indicatorRef: MutableRefObject<ClickIndicatorData | null>,
): void {
  const { camera, gl } = useThree();

  useEffect(() => {
    const target = gl.domElement.parentElement ?? gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (useEditorStore.getState().enabled) return;

      const rect = target.getBoundingClientRect();
      _mouse.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      _raycaster.setFromCamera(_mouse, camera);

      const hit = _raycaster.ray.intersectPlane(_groundPlane, _hitPoint);
      if (hit) {
        const { x, z } = _hitPoint;
        const surfY = getSurfaceHeight(x, z);
        usePlayerStore.getState().setTargetPosition([x, surfY, z]);
        indicatorRef.current = { position: [x, surfY + 0.05, z], time: Date.now() };
      }
    };

    target.addEventListener('pointerdown', handlePointerDown);
    return () => target.removeEventListener('pointerdown', handlePointerDown);
  }, [camera, gl, indicatorRef]);
}
