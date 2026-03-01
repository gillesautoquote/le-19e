import { useRef, useMemo, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Color, Fog } from 'three';
import { EPOCH_A, EPOCH_B } from '@/constants/epochs';
import { FOG } from '@/constants/world';
import { useWorldStore } from '@/store/worldStore';
import { useStreamingData } from '@/hooks/useStreamingData';
import { buildRoadGrades } from '@/systems/roadGradeSystem';
import { useClickToMove } from '@/hooks/useClickToMove';

import Lighting from '@/atoms/Lighting';
import PostProcessing from '@/atoms/PostProcessing';
import Sky from '@/atoms/Sky';
import Quay from '@/molecules/Quay';
import Water from '@/atoms/Water';
import Player from '@/atoms/Player';
import CameraRig from '@/organisms/CameraRig';
import EditorControls from '@/organisms/EditorControls';
import ClickIndicator from '@/atoms/ClickIndicator';
import OSMBuildings from '@/organisms/OSMBuildings';
import OSMTrees from '@/organisms/OSMTrees';
import OSMFurniture from '@/organisms/OSMFurniture';
import OSMRoads from '@/organisms/OSMRoads';
import OSMParks from '@/organisms/OSMParks';
import OSMPointFeatures from '@/organisms/OSMPointFeatures';
import OSMAnimatedEntities from '@/organisms/OSMAnimatedEntities';
import OSMPaths from '@/organisms/OSMPaths';
import OSMQuayWalls from '@/organisms/OSMQuayWalls';
import OSMBushes from '@/organisms/OSMBushes';
import OSMRocks from '@/organisms/OSMRocks';
import OSMStaticCars from '@/organisms/OSMStaticCars';
import OSMUrbanDetails from '@/organisms/OSMUrbanDetails';
import OSMParkTiles from '@/organisms/OSMParkTiles';
import Terrain from '@/atoms/Terrain';
import LampLights from '@/atoms/LampLights';
import FadeGroup from '@/atoms/FadeGroup';
import GrassPatches from '@/atoms/GrassPatches';
import RemotePlayers from '@/organisms/RemotePlayers';
import DebugRoadOverlay from '@/organisms/DebugRoadOverlay';

export default function CanalOurcq() {
  const { scene } = useThree();
  const clickIndicatorRef = useRef<{ position: [number, number, number]; time: number } | null>(null);
  const fogColorRef = useRef(new Color(EPOCH_A.fog));
  const targetFogColorRef = useRef(new Color(EPOCH_A.fog));
  const targetSkyColorRef = useRef(new Color(EPOCH_A.sky));

  // Stream real OSM data (tiles loaded dynamically around player)
  const osmData = useStreamingData();

  // Pre-compute smooth road grades (must precede road tile/ribbon consumers)
  useMemo(() => {
    if (osmData.roads.length > 0) buildRoadGrades(osmData.roads);
  }, [osmData.roads]);

  // Initialize scene fog (linear Fog for ~150m clear visibility)
  useEffect(() => {
    scene.background = new Color(EPOCH_A.sky);
    scene.fog = new Fog(EPOCH_A.fog, FOG.near, FOG.far);
  }, [scene]);

  // Smooth fog & sky color transition when epoch changes
  useFrame((_, delta) => {
    const epoch = useWorldStore.getState().epoch;
    const palette = epoch === 'A' ? EPOCH_A : EPOCH_B;
    targetFogColorRef.current.set(palette.fog);
    targetSkyColorRef.current.set(palette.sky);

    fogColorRef.current.lerp(targetFogColorRef.current, delta * FOG.transitionSpeed);

    if (scene.fog instanceof Fog) {
      scene.fog.color.copy(fogColorRef.current);
    }

    if (scene.background instanceof Color) {
      scene.background.lerp(targetSkyColorRef.current, delta * FOG.transitionSpeed);
    }
  });

  // Click-to-move
  useClickToMove(clickIndicatorRef);

  return (
    <>
      {/* Lighting */}
      <Lighting />

      {/* Sky */}
      <Sky />

      {/* Post-processing effects */}
      <PostProcessing />

      {/* Ground terrain */}
      <Terrain waterways={osmData.waterways} />

      {/* World */}
      <Quay waterways={osmData.waterways} roadCount={osmData.roads.length} />
      <Water waterways={osmData.waterways} />
      <OSMQuayWalls waterways={osmData.waterways} />

      {/* OSM data → real geometry (fade-in on tile load) */}
      <FadeGroup dataVersion={osmData.parks.length}><OSMParks parks={osmData.parks} /></FadeGroup>
      <OSMParkTiles parks={osmData.parks} />
      <FadeGroup dataVersion={osmData.roads.length}><OSMRoads roads={osmData.roads} /></FadeGroup>
      <FadeGroup dataVersion={osmData.buildings.length}><OSMBuildings buildings={osmData.buildings} /></FadeGroup>
      <FadeGroup dataVersion={osmData.trees.length}><OSMTrees trees={osmData.trees} /></FadeGroup>
      <OSMBushes parks={osmData.parks} />
      <GrassPatches parks={osmData.parks} />
      <OSMRocks parks={osmData.parks} waterways={osmData.waterways} />
      <OSMStaticCars roads={osmData.roads} />
      <OSMUrbanDetails roads={osmData.roads} />
      <OSMFurniture benches={osmData.benches} lamps={osmData.lamps} />
      <LampLights lamps={osmData.lamps} />
      <OSMAnimatedEntities roads={osmData.roads} waterways={osmData.waterways} trees={osmData.trees} />
      <OSMPaths roads={osmData.roads} />
      <OSMPointFeatures
        fountains={osmData.fountains}
        velibs={osmData.velibs}
        busStops={osmData.busStops}
        trafficLights={osmData.trafficLights}
        shops={osmData.shops}
        barges={osmData.barges}
        locks={osmData.locks}
        wasteBins={osmData.wasteBins}
      />

      {/* Debug overlay */}
      <DebugRoadOverlay roads={osmData.roads} />

      {/* Player */}
      <Player />
      <ClickIndicator indicatorRef={clickIndicatorRef} />
      <RemotePlayers />

      {/* Camera */}
      <CameraRig />

      {/* Editor (dev only) */}
      <EditorControls />
    </>
  );
}
