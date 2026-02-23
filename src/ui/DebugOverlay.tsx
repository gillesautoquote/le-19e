import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useStreamingStore } from '@/store/streamingStore';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { sceneToGps } from '@/utils/geoUtils';

const WS_URL = import.meta.env.VITE_WS_URL
  || `ws://${window.location.host}`;

const STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  background: 'rgba(0,0,0,0.7)',
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '6px 10px',
  borderRadius: 4,
  pointerEvents: 'none',
  zIndex: 100,
  lineHeight: 1.6,
  whiteSpace: 'pre',
};

export default function DebugOverlay() {
  const [info, setInfo] = useState('');

  useEffect(() => {
    const update = () => {
      const { position } = usePlayerStore.getState();
      const [x, , z] = position;
      const [lat, lng] = sceneToGps(x, z);

      const store = useStreamingStore.getState();
      const tileCount = store.tileData.size;
      const merged = store.merged;

      const mp = useMultiplayerStore.getState();

      const lines = [
        `pos  x=${x.toFixed(0)}  z=${z.toFixed(0)}`,
        `gps  ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        `tiles ${tileCount}`,
        `bld ${merged.buildings.length}  road ${merged.roads.length}`,
        `water ${merged.water.length}  park ${merged.parks.length}`,
        `tree ${merged.trees.length}  lamp ${merged.lamps.length}`,
        `shop ${merged.shops.length}  bench ${merged.benches.length}`,
        `--- multiplayer ---`,
        `net  ${mp.connectionStatus}`,
        `id   ${mp.localId || '—'}`,
        `name ${mp.localName || '—'}`,
        `players ${mp.playerCount}  remote ${mp.remotePlayers.size}`,
        `ws   ${WS_URL}`,
      ];

      if (store.error) lines.push(`ERR: ${store.error}`);

      setInfo(lines.join('\n'));
    };

    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, []);

  return <div style={STYLE}>{info}</div>;
}
