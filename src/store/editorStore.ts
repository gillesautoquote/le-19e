import { create } from 'zustand';
import { Object3D } from 'three';

type TransformMode = 'translate' | 'rotate' | 'scale';

interface EditorStore {
  enabled: boolean;
  selectedObject: Object3D | null;
  transformMode: TransformMode;
  isDraggingGizmo: boolean;

  toggle: () => void;
  selectObject: (obj: Object3D | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  setDraggingGizmo: (dragging: boolean) => void;
  clearSelection: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  enabled: false,
  selectedObject: null,
  transformMode: 'translate',
  isDraggingGizmo: false,

  toggle: () =>
    set((s) => ({
      enabled: !s.enabled,
      selectedObject: s.enabled ? null : s.selectedObject,
    })),
  selectObject: (obj) => set({ selectedObject: obj }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setDraggingGizmo: (dragging) => set({ isDraggingGizmo: dragging }),
  clearSelection: () => set({ selectedObject: null }),
}));
