import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { PCFSoftShadowMap } from 'three';
import { useWorldStore } from '@/store/worldStore';
import { initAudio } from '@/systems/audioSystem';
import { initNetwork } from '@/systems/networkSystem';
import { CAMERA } from '@/constants/world';
import '@/hooks/useAssets'; // Trigger GLB preloads at module level
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
import DebugRoadPanel from '@/ui/DebugRoadPanel';
import EditorOverlay from '@/ui/EditorOverlay';

export default function App() {
  const isStarted = useWorldStore((s) => s.isStarted);
  const start = useWorldStore((s) => s.start);
  const { progress, total } = useProgress();
  const isLoaded = total > 0 && progress >= 100;
  const [showLoading, setShowLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Fade out loading screen once assets are ready
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setShowLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

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
            dpr={1.5}
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
          <DebugRoadPanel />
          <EditorOverlay />
        </div>
      )}
      {showLoading && <LoadingScreen progress={progress} isLoaded={isLoaded} />}
    </>
  );
}
