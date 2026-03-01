import { useEffect, useState, useCallback } from 'react';
import { useDebugStore } from '@/store/debugStore';
import { useStreamingStore } from '@/store/streamingStore';
import { computeRoadDebugInfo } from '@/utils/debugGeometry';
import type { RoadDebugInfo } from '@/utils/debugGeometry';

const PANEL: React.CSSProperties = {
  position: 'fixed',
  top: 100,
  right: 20,
  width: 260,
  background: 'rgba(0, 0, 0, 0.85)',
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: 12,
  borderRadius: 6,
  zIndex: 200,
  maxHeight: '70vh',
  overflowY: 'auto',
  border: '1px solid rgba(255,255,255,0.15)',
};

const ROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
};

const DOT: (c: string) => React.CSSProperties = (c) => ({
  width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0,
});

const SECTION: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 6,
};

interface ToggleProps {
  label: string;
  color: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, color, checked, onChange }: ToggleProps) {
  return (
    <label style={ROW}>
      <span style={DOT(color)} />
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ margin: 0 }}
      />
      <span style={{ opacity: checked ? 1 : 0.4 }}>{label}</span>
    </label>
  );
}

export default function DebugRoadPanel() {
  const enabled = useDebugStore((s) => s.enabled);
  const toggle = useDebugStore((s) => s.toggle);

  const showCenterlines = useDebugStore((s) => s.showCenterlines);
  const showRoadWidths = useDebugStore((s) => s.showRoadWidths);
  const showSidewalkBounds = useDebugStore((s) => s.showSidewalkBounds);
  const showTileMarkers = useDebugStore((s) => s.showTileMarkers);
  const showGradeProfile = useDebugStore((s) => s.showGradeProfile);
  const showTerrainWireframe = useDebugStore((s) => s.showTerrainWireframe);

  const [info, setInfo] = useState<RoadDebugInfo | null>(null);

  // Keyboard shortcut: Shift+D to toggle debug
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.shiftKey) { toggle(); e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  // Compute road info when debug is enabled
  const refreshInfo = useCallback(() => {
    const merged = useStreamingStore.getState().merged;
    if (merged.roads.length > 0) {
      setInfo(computeRoadDebugInfo(merged.roads));
    }
  }, []);

  useEffect(() => {
    if (enabled) refreshInfo();
  }, [enabled, refreshInfo]);

  if (!enabled) return null;

  return (
    <div style={PANEL}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 13 }}>
        Road Debug  <span style={{ fontSize: 10, opacity: 0.4 }}>Shift+D</span>
      </div>

      <Toggle label="Centerlines (OSM)" color="#FFD700" checked={showCenterlines}
        onChange={useDebugStore.getState().setShowCenterlines} />
      <Toggle label="Road width edges" color="#FF8C00" checked={showRoadWidths}
        onChange={useDebugStore.getState().setShowRoadWidths} />
      <Toggle label="Sidewalk bounds" color="#00CED1" checked={showSidewalkBounds}
        onChange={useDebugStore.getState().setShowSidewalkBounds} />
      <Toggle label="Tile grid" color="#FF00FF" checked={showTileMarkers}
        onChange={useDebugStore.getState().setShowTileMarkers} />
      <Toggle label="Grade profile" color="#00FF7F" checked={showGradeProfile}
        onChange={useDebugStore.getState().setShowGradeProfile} />
      <Toggle label="Terrain wireframe" color="#888" checked={showTerrainWireframe}
        onChange={useDebugStore.getState().setShowTerrainWireframe} />

      {info && (
        <div style={SECTION}>
          <div>Roads: {info.totalRoads} ({info.vehicleRoads} vehicle)</div>
          <div>Total length: {(info.totalLength / 1000).toFixed(1)}km</div>
          <div style={{ marginTop: 4, opacity: 0.6 }}>
            {Object.entries(info.types).map(([k, v]) => (
              <div key={k}>{k}: {v}</div>
            ))}
          </div>
          <div style={{ marginTop: 4, opacity: 0.6 }}>
            {Object.entries(info.widths).map(([k, v]) => (
              <div key={k}>w={k}: {v}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
