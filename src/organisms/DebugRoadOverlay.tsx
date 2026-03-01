import { useMemo, memo } from 'react';
import { useDebugStore } from '@/store/debugStore';
import {
  buildCenterlineGeometry,
  buildRoadWidthGeometry,
  buildSidewalkBoundsGeometry,
  buildGradeMarkerGeometry,
  buildTileGridGeometry,
} from '@/utils/debugGeometry';
import { useStreamingStore } from '@/store/streamingStore';
import { EPOCH_A } from '@/constants/epochs';
import type { SceneRoad } from '@/types/osm';

interface DebugRoadOverlayProps {
  roads: SceneRoad[];
}

/**
 * 3D debug overlay rendering road centerlines, width edges,
 * sidewalk bounds, grade markers, and tile positions.
 * Only renders when debug mode is enabled.
 */
export default memo(function DebugRoadOverlay({ roads }: DebugRoadOverlayProps) {
  const enabled = useDebugStore((s) => s.enabled);
  const showCenterlines = useDebugStore((s) => s.showCenterlines);
  const showRoadWidths = useDebugStore((s) => s.showRoadWidths);
  const showSidewalkBounds = useDebugStore((s) => s.showSidewalkBounds);
  const showGradeProfile = useDebugStore((s) => s.showGradeProfile);
  const showTileMarkers = useDebugStore((s) => s.showTileMarkers);

  // Only build geometries when debug is on (skip work otherwise)
  const centerlines = useMemo(
    () => (enabled && showCenterlines ? buildCenterlineGeometry(roads) : null),
    [roads, enabled, showCenterlines],
  );
  const roadWidths = useMemo(
    () => (enabled && showRoadWidths ? buildRoadWidthGeometry(roads) : null),
    [roads, enabled, showRoadWidths],
  );
  const sidewalks = useMemo(
    () => (enabled && showSidewalkBounds ? buildSidewalkBoundsGeometry(roads) : null),
    [roads, enabled, showSidewalkBounds],
  );
  const gradeMarkers = useMemo(
    () => (enabled && showGradeProfile ? buildGradeMarkerGeometry(roads) : null),
    [roads, enabled, showGradeProfile],
  );
  const manifest = useStreamingStore((s) => s.manifest);
  const tileData = useStreamingStore((s) => s.tileData);
  const tileGrid = useMemo(
    () => {
      if (!enabled || !showTileMarkers || !manifest) return null;
      const loadedKeys = Array.from(tileData.keys());
      return buildTileGridGeometry(loadedKeys, manifest.tileSize);
    },
    [tileData, manifest, enabled, showTileMarkers],
  );

  if (!enabled) return null;

  return (
    <group>
      {/* Yellow: OSM road centerlines */}
      {centerlines && (
        <lineSegments geometry={centerlines}>
          <lineBasicMaterial color={EPOCH_A.debugCenterline} linewidth={1} depthTest={false} />
        </lineSegments>
      )}

      {/* Orange: road width edges */}
      {roadWidths && (
        <lineSegments geometry={roadWidths}>
          <lineBasicMaterial color={EPOCH_A.debugRoadWidth} linewidth={1} depthTest={false} />
        </lineSegments>
      )}

      {/* Cyan: sidewalk outer edges */}
      {sidewalks && (
        <lineSegments geometry={sidewalks}>
          <lineBasicMaterial color={EPOCH_A.debugSidewalk} linewidth={1} depthTest={false} />
        </lineSegments>
      )}

      {/* Green: grade profile lines */}
      {gradeMarkers && (
        <lineSegments geometry={gradeMarkers}>
          <lineBasicMaterial color={EPOCH_A.debugGrade} linewidth={1} depthTest={false} />
        </lineSegments>
      )}

      {/* Magenta: tile grid outlines */}
      {tileGrid && (
        <lineSegments geometry={tileGrid}>
          <lineBasicMaterial color={EPOCH_A.debugTileMarker} linewidth={1} depthTest={false} />
        </lineSegments>
      )}
    </group>
  );
});
