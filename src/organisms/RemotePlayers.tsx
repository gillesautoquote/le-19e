import { useMemo } from 'react';
import { EPOCH_A } from '@/constants/epochs';
import { MULTIPLAYER } from '@/constants/multiplayer';
import { useMultiplayerStore } from '@/store/multiplayerStore';
import { usePlayerStore } from '@/store/playerStore';
import { hashString } from '@/utils/geoUtils';
import RemotePlayer from '@/molecules/RemotePlayer';
import type { RemotePlayerData } from '@/types/multiplayer';

const BODY_COLOR_KEYS = [
  'remoteBodyA', 'remoteBodyB', 'remoteBodyC', 'remoteBodyD',
  'remoteBodyE', 'remoteBodyF', 'remoteBodyG', 'remoteBodyH',
] as const;

/** Get body color for a remote player from epochs palette */
function getBodyColor(name: string): string {
  const idx = Math.abs(hashString(name)) % MULTIPLAYER.bodyColorCount;
  const key = BODY_COLOR_KEYS[idx];
  return EPOCH_A[key];
}

/** Sort remote players by distance to local player, closest first */
function sortByDistance(
  players: RemotePlayerData[],
  px: number,
  pz: number,
): RemotePlayerData[] {
  return players.sort((a, b) => {
    const da = (a.x - px) ** 2 + (a.z - pz) ** 2;
    const db = (b.x - px) ** 2 + (b.z - pz) ** 2;
    return da - db;
  });
}

export default function RemotePlayers() {
  const remotePlayers = useMultiplayerStore((s) => s.remotePlayers);
  const playerPos = usePlayerStore((s) => s.position);

  const visiblePlayers = useMemo(() => {
    const px = playerPos[0];
    const pz = playerPos[2];
    const maxDist2 = MULTIPLAYER.visibilityRadius ** 2;

    // Filter players within visibility radius
    const inRange: RemotePlayerData[] = [];
    for (const [, player] of remotePlayers) {
      const dx = player.x - px;
      const dz = player.z - pz;
      if (dx * dx + dz * dz <= maxDist2) {
        inRange.push(player);
      }
    }

    // Sort by distance and cap at max visible
    return sortByDistance(inRange, px, pz).slice(0, MULTIPLAYER.maxVisiblePlayers);
  }, [remotePlayers, playerPos]);

  return (
    <>
      {visiblePlayers.map((player) => (
        <RemotePlayer
          key={player.id}
          playerId={player.id}
          name={player.name}
          bodyColor={getBodyColor(player.name)}
          headColor={EPOCH_A.remoteHead}
          legsColor={EPOCH_A.remoteLegs}
          initialX={player.x}
          initialZ={player.z}
          initialRotation={player.rotation}
        />
      ))}
    </>
  );
}
