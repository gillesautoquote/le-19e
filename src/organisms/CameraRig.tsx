import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { CAMERA } from '@/constants/world';
import { usePlayerStore } from '@/store/playerStore';
import { useCameraStore } from '@/store/cameraStore';
import {
  createInitialCameraState,
  applyZoom,
  applyOrbit,
  applyKeyboardRotation,
  sphericalToOffset,
  type CameraState,
} from '@/systems/cameraSystem';
import { initInput, disposeInput, getKeys } from '@/systems/inputSystem';

const _target = new Vector3();

export default function CameraRig() {
  const { camera, gl } = useThree();
  const stateRef = useRef<CameraState>(createInitialCameraState());
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      stateRef.current = applyZoom(stateRef.current, e.deltaY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        e.preventDefault();
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      stateRef.current = applyOrbit(stateRef.current, dx, dy);
    };

    const handleMouseUp = () => { isDraggingRef.current = false; };
    const handleContextMenu = (e: Event) => e.preventDefault();

    let lastTouchDist = 0;
    let lastTouchCenter = { x: 0, y: 0 };
    let isTwoFinger = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isTwoFinger = true;
        const t = e.touches;
        lastTouchDist = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
        lastTouchCenter = {
          x: (t[0].clientX + t[1].clientX) / 2,
          y: (t[0].clientY + t[1].clientY) / 2,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTwoFinger || e.touches.length !== 2) return;
      e.preventDefault();
      const t = e.touches;
      const dist = Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
      const center = {
        x: (t[0].clientX + t[1].clientX) / 2,
        y: (t[0].clientY + t[1].clientY) / 2,
      };

      const pinchDelta = (lastTouchDist - dist) * 5;
      stateRef.current = applyZoom(stateRef.current, pinchDelta);

      const dx = center.x - lastTouchCenter.x;
      const dy = center.y - lastTouchCenter.y;
      stateRef.current = applyOrbit(stateRef.current, dx, dy);

      lastTouchDist = dist;
      lastTouchCenter = center;
    };

    const handleTouchEnd = () => { isTwoFinger = false; };

    initInput();

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      disposeInput();
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const pos = usePlayerStore.getState().position;

    stateRef.current = applyKeyboardRotation(stateRef.current, delta, getKeys());

    const [ox, oy, oz] = sphericalToOffset(stateRef.current);
    _target.set(pos[0] + ox, pos[1] + oy, pos[2] + oz);

    camera.position.lerp(_target, CAMERA.followSmoothness);
    camera.lookAt(pos[0], (pos[1] || 0) + 1, pos[2]);

    useCameraStore.getState().updateTheta(stateRef.current.theta);
  });

  return null;
}
