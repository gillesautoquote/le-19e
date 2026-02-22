import { create } from 'zustand';
import { PLAYER } from '@/constants/player';

interface PlayerStore {
  position: [number, number, number];
  targetPosition: [number, number, number] | null;
  rotation: number;
  isMoving: boolean;

  setTargetPosition: (pos: [number, number, number]) => void;
  updatePosition: (pos: [number, number, number]) => void;
  updateRotation: (angle: number) => void;
  stopMovement: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  position: [PLAYER.startX, 0, PLAYER.startZ],
  targetPosition: null,
  rotation: 0,
  isMoving: false,

  setTargetPosition: (pos) => set({ targetPosition: pos, isMoving: true }),
  updatePosition: (pos) => set({ position: pos }),
  updateRotation: (angle) => set({ rotation: angle }),
  stopMovement: () => set({ targetPosition: null, isMoving: false }),
}));
