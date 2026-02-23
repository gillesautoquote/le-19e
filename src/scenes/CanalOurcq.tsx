import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect } from 'react';
import { Color, Fog, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { EPOCH_A, EPOCH_B } from '@/constants/epochs';
import { FOG } from '@/constants/world';
import { usePlayerStore } from '@/store/playerStore';
import { useWorldStore } from '@/store/worldStore';
import { useStreamingData } from '@/hooks/useStreamingData';
import { getTerrainHeight } from '@/systems/terrainSystem';

import Lighting from '@/atoms/Lighting';
import PostProcessing from '@/atoms/PostProcessing';
import Sky from '@/atoms/Sky';
import Quay from '@/molecules/Quay';
import Water from '@/atoms/Water';
import Player from '@/atoms/Player';
import CameraRig from '@/organisms/CameraRig';
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
import RemotePlayers from '@/organisms/RemotePlayers';

// Reusable objects for ground click raycasting (avoid allocations)
const _raycaster = new Raycaster();
const _mouse = new Vector2();
const _groundPlane = new Plane(new Vector3(0, 1, 0), 0);
const _hitPoint = new Vector3();

export default function CanalOurcq() {
  const { scene, camera, gl } = useThree();
  const clickIndicatorRef = useRef<{ position: [number, number, number]; time: number } | null>(null);
  const fogColorRef = useRef(new Color(EPOCH_A.fog));

  // Stream real OSM data (tiles loaded dynamically around player)
  const osmData = useStreamingData();

  // Initialize scene fog (linear Fog for ~150m clear visibility)
  useEffect(() => {
    scene.background = new Color(EPOCH_A.sky);
    scene.fog = new Fog(EPOCH_A.fog, FOG.near, FOG.far);
  }, [scene]);

  // Smooth fog & sky color transition when epoch changes
  useFrame((_, delta) => {
    const epoch = useWorldStore.getState().epoch;
    const palette = epoch === 'A' ? EPOCH_A : EPOCH_B;
    const targetFogColor = new Color(palette.fog);
    const targetSkyColor = new Color(palette.sky);

    fogColorRef.current.lerp(targetFogColor, delta * FOG.transitionSpeed);

    if (scene.fog instanceof Fog) {
      scene.fog.color.copy(fogColorRef.current);
    }

    if (scene.background instanceof Color) {
      scene.background.lerp(targetSkyColor, delta * FOG.transitionSpeed);
    }
  });

  // Click-to-move: listen on canvas parent (R3F event source) → ray/plane Y=0
  useEffect(() => {
    const target = gl.domElement.parentElement ?? gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // left-click only

      const rect = target.getBoundingClientRect();
      _mouse.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      _raycaster.setFromCamera(_mouse, camera);

      const hit = _raycaster.ray.intersectPlane(_groundPlane, _hitPoint);
      if (hit) {
        const { x, z } = _hitPoint;
        const terrainY = getTerrainHeight(x, z);
        usePlayerStore.getState().setTargetPosition([x, terrainY, z]);
        clickIndicatorRef.current = { position: [x, terrainY + 0.05, z], time: Date.now() };
      }
    };

    target.addEventListener('pointerdown', handlePointerDown);
    return () => target.removeEventListener('pointerdown', handlePointerDown);
  }, [camera, gl]);

  return (
    <>
      {/* Lighting */}
      <Lighting />

      {/* Sky */}
      <Sky />

      {/* Post-processing effects */}
      <PostProcessing />

      {/* World */}
      <Quay />
      <Water waterways={osmData.waterways} />
      <OSMQuayWalls waterways={osmData.waterways} />

      {/* OSM data → real geometry */}
      <OSMParks parks={osmData.parks} />
      <OSMRoads roads={osmData.roads} />
      <OSMBuildings buildings={osmData.buildings} />
      <OSMTrees trees={osmData.trees} />
      <OSMFurniture benches={osmData.benches} lamps={osmData.lamps} />
      <OSMAnimatedEntities roads={osmData.roads} waterways={osmData.waterways} />
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

      {/* Player */}
      <Player />
      <ClickIndicator indicatorRef={clickIndicatorRef} />
      <RemotePlayers />

      {/* Camera */}
      <CameraRig />
    </>
  );
}
