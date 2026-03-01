import { create } from 'zustand';

interface DebugStore {
  enabled: boolean;
  showCenterlines: boolean;
  showRoadWidths: boolean;
  showSidewalkBounds: boolean;
  showTileMarkers: boolean;
  showGradeProfile: boolean;
  showTerrainWireframe: boolean;
  toggle: () => void;
  setShowCenterlines: (v: boolean) => void;
  setShowRoadWidths: (v: boolean) => void;
  setShowSidewalkBounds: (v: boolean) => void;
  setShowTileMarkers: (v: boolean) => void;
  setShowGradeProfile: (v: boolean) => void;
  setShowTerrainWireframe: (v: boolean) => void;
}

export const useDebugStore = create<DebugStore>((set) => ({
  enabled: false,
  showCenterlines: true,
  showRoadWidths: true,
  showSidewalkBounds: true,
  showTileMarkers: true,
  showGradeProfile: true,
  showTerrainWireframe: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  setShowCenterlines: (v) => set({ showCenterlines: v }),
  setShowRoadWidths: (v) => set({ showRoadWidths: v }),
  setShowSidewalkBounds: (v) => set({ showSidewalkBounds: v }),
  setShowTileMarkers: (v) => set({ showTileMarkers: v }),
  setShowGradeProfile: (v) => set({ showGradeProfile: v }),
  setShowTerrainWireframe: (v) => set({ showTerrainWireframe: v }),
}));
