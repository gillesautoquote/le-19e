import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PCFSoftShadowMap } from 'three';
import { useWorldStore } from '@/store/worldStore';
import { initAudio } from '@/systems/audioSystem';
import { CAMERA } from '@/constants/world';
import '@/styles/ui.css';

import CanalOurcq from '@/scenes/CanalOurcq';
import LoadingScreen from '@/ui/LoadingScreen';
import MainMenu from '@/ui/MainMenu';
import Minimap from '@/ui/Minimap';
import MuteButton from '@/ui/MuteButton';
import EpochIndicator from '@/ui/EpochIndicator';
import DebugOverlay from '@/ui/DebugOverlay';

export default function App() {
  const isStarted = useWorldStore((s) => s.isStarted);
  const start = useWorldStore((s) => s.start);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsLoaded(true);
          setTimeout(() => setShowLoading(false), 800);
        }, 300);
      }
      setLoadProgress(Math.min(progress, 100));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    start();
    initAudio();
  };

  return (
    <>
      {!showLoading && !isStarted && <MainMenu onStart={handleStart} />}
      {isStarted && (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{
              fov: CAMERA.fov,
              near: CAMERA.near,
              far: CAMERA.far,
              position: [...CAMERA.initialPosition],
            }}
            gl={{ antialias: true }}
            onCreated={({ gl }) => {
              gl.shadowMap.type = PCFSoftShadowMap;
            }}
          >
            <CanalOurcq />
          </Canvas>
          <DebugOverlay />
          <Minimap />
          <MuteButton />
          <EpochIndicator />
        </div>
      )}
      {showLoading && <LoadingScreen progress={loadProgress} isLoaded={isLoaded} />}
    </>
  );
}
