import { create } from 'zustand';

interface WorldStore {
  epoch: 'A' | 'B';
  isStarted: boolean;

  start: () => void;
  setEpoch: (epoch: 'A' | 'B') => void;
}

export const useWorldStore = create<WorldStore>((set) => ({
  epoch: 'A',
  isStarted: false,

  start: () => set({ isStarted: true }),
  setEpoch: (epoch) => set({ epoch }),
}));
