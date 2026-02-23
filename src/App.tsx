import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PCFSoftShadowMap } from 'three';
import { useWorldStore } from '@/store/worldStore';
import { initAudio } from '@/systems/audioSystem';
import { initNetwork } from '@/systems/networkSystem';
import { CAMERA } from '@/constants/world';
import '@/styles/ui.css';

import CanalOurcq from '@/scenes/CanalOurcq';
import LoadingScreen from '@/ui/LoadingScreen';
import MainMenu from '@/ui/MainMenu';
import NamePrompt from '@/ui/NamePrompt';
import Minimap from '@/ui/Minimap';
import MuteButton from '@/ui/MuteButton';
import EpochIndicator from '@/ui/EpochIndicator';
import DebugOverlay from '@/ui/DebugOverlay';
import ChatBox from '@/ui/ChatBox';
import PlayerCount from '@/ui/PlayerCount';
import ConnectionStatus from '@/ui/ConnectionStatus';

export default function App() {
  const isStarted = useWorldStore((s) => s.isStarted);
  const start = useWorldStore((s) => s.start);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

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

  const handleMenuStart = () => {
    setShowNamePrompt(true);
  };

  const handleNameSubmit = (name: string) => {
    setShowNamePrompt(false);
    start();
    initAudio();
    initNetwork(name);
  };

  return (
    <>
      {!showLoading && !isStarted && !showNamePrompt && (
        <MainMenu onStart={handleMenuStart} />
      )}
      {!showLoading && !isStarted && showNamePrompt && (
        <NamePrompt onSubmit={handleNameSubmit} />
      )}
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
          <ChatBox />
          <PlayerCount />
          <ConnectionStatus />
        </div>
      )}
      {showLoading && <LoadingScreen progress={loadProgress} isLoaded={isLoaded} />}
    </>
  );
}
