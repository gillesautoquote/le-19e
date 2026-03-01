import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { Raycaster, Vector2, Object3D } from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import { useEditorStore } from '@/store/editorStore';
import { isChatFocused } from '@/systems/inputSystem';

const _raycaster = new Raycaster();
const _mouse = new Vector2();

/** Walks up the parent chain to find a meaningful selectable object. */
function findSelectable(hit: Object3D, sceneRoot: Object3D): Object3D {
  let target = hit;
  while (target.parent && target.parent !== sceneRoot) {
    if (target.name) break;
    target = target.parent;
  }
  return target;
}

/** Checks if an object belongs to the TransformControls gizmo. */
function isGizmoObject(obj: Object3D): boolean {
  let current: Object3D | null = obj;
  while (current) {
    if (current.type === 'TransformControlsPlane'
      || current.type === 'TransformControlsGizmo') {
      return true;
    }
    current = current.parent;
  }
  return false;
}

export default function EditorControls() {
  const enabled = useEditorStore((s) => s.enabled);
  const selectedObject = useEditorStore((s) => s.selectedObject);
  const transformMode = useEditorStore((s) => s.transformMode);
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<TransformControlsImpl>(null);

  // Force mode on the underlying Three.js controls when it changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // Listen to dragging-changed event from TransformControls
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const handler = (event: { type: string; value: boolean }) => {
      useEditorStore.getState().setDraggingGizmo(event.value);
    };
    // Three.js TransformControls emits 'dragging-changed' (not in typed map)
    const target = ctrl as unknown as { addEventListener: (t: string, fn: typeof handler) => void; removeEventListener: (t: string, fn: typeof handler) => void };
    target.addEventListener('dragging-changed', handler);
    return () => target.removeEventListener('dragging-changed', handler);
  }, [selectedObject]);

  // Keyboard: E toggle, T/R/S mode, Escape deselect — capture phase
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChatFocused()) return;
      const key = e.key.toLowerCase();

      if (key === 'e' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        useEditorStore.getState().toggle();
        return;
      }

      if (!useEditorStore.getState().enabled) return;

      if (key === 't') {
        e.preventDefault();
        e.stopPropagation();
        useEditorStore.getState().setTransformMode('translate');
      } else if (key === 'r') {
        e.preventDefault();
        e.stopPropagation();
        useEditorStore.getState().setTransformMode('rotate');
      } else if (key === 's' && !e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        useEditorStore.getState().setTransformMode('scale');
      } else if (key === 'escape') {
        e.preventDefault();
        e.stopPropagation();
        useEditorStore.getState().clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Click to select objects
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (useEditorStore.getState().isDraggingGizmo) return;

      const rect = gl.domElement.getBoundingClientRect();
      _mouse.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      _raycaster.setFromCamera(_mouse, camera);

      const intersects = _raycaster.intersectObjects(scene.children, true);
      for (const hit of intersects) {
        if (isGizmoObject(hit.object)) continue;
        const target = findSelectable(hit.object, scene);
        useEditorStore.getState().selectObject(target);
        return;
      }

      useEditorStore.getState().clearSelection();
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    return () => gl.domElement.removeEventListener('pointerdown', handlePointerDown);
  }, [enabled, camera, gl, scene]);

  if (!enabled || !selectedObject) return null;

  return (
    <TransformControls
      ref={controlsRef}
      object={selectedObject}
      mode={transformMode}
    />
  );
}
