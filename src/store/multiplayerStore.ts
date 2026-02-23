import { create } from 'zustand';
import { MULTIPLAYER } from '@/constants/multiplayer';
import type {
  RemotePlayerData,
  ConnectionStatus,
  InterpolationBuffer,
} from '@/types/multiplayer';

interface MultiplayerStore {
  remotePlayers: Map<string, RemotePlayerData>;
  interpolation: Map<string, InterpolationBuffer>;
  playerCount: number;
  connectionStatus: ConnectionStatus;
  localName: string;
  localId: string;

  setRemotePlayer: (id: string, data: Partial<RemotePlayerData>) => void;
  removeRemotePlayer: (id: string) => void;
  setPlayerCount: (count: number) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLocalName: (name: string) => void;
  setLocalId: (id: string) => void;
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  remotePlayers: new Map(),
  interpolation: new Map(),
  playerCount: 0,
  connectionStatus: 'disconnected',
  localName: '',
  localId: '',

  setRemotePlayer: (id, data) => {
    const { remotePlayers, interpolation, localId } = get();
    // Skip local player
    if (id === localId) return;

    const existing = remotePlayers.get(id);
    if (existing) {
      // Update interpolation buffer
      const buf = interpolation.get(id);
      if (buf && data.x !== undefined && data.z !== undefined) {
        buf.prevX = buf.targetX;
        buf.prevZ = buf.targetZ;
        buf.prevRotation = buf.targetRotation;
        buf.targetX = data.x;
        buf.targetZ = data.z;
        buf.targetRotation = data.rotation ?? buf.targetRotation;
        buf.elapsed = 0;
      }
      Object.assign(existing, data);
    } else {
      // New player
      const player: RemotePlayerData = {
        id,
        name: data.name ?? MULTIPLAYER.nameDefault,
        x: data.x ?? 0,
        z: data.z ?? 0,
        rotation: data.rotation ?? 0,
        anim: data.anim ?? 0,
        epoch: data.epoch ?? 'A',
      };
      remotePlayers.set(id, player);
      interpolation.set(id, {
        prevX: player.x,
        prevZ: player.z,
        prevRotation: player.rotation,
        targetX: player.x,
        targetZ: player.z,
        targetRotation: player.rotation,
        elapsed: MULTIPLAYER.interpolationDuration,
        duration: MULTIPLAYER.interpolationDuration,
      });
    }
    // Trigger re-render for subscribers
    set({ remotePlayers: new Map(remotePlayers) });
  },

  removeRemotePlayer: (id) => {
    const { remotePlayers, interpolation } = get();
    remotePlayers.delete(id);
    interpolation.delete(id);
    set({ remotePlayers: new Map(remotePlayers) });
  },

  setPlayerCount: (count) => set({ playerCount: count }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLocalName: (name) => set({ localName: name }),
  setLocalId: (id) => set({ localId: id }),
}));
