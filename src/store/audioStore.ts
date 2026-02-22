import { create } from 'zustand';

interface AudioStore {
  isMuted: boolean;
  isInitialized: boolean;

  toggleMute: () => void;
  setInitialized: () => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  isMuted: false,
  isInitialized: false,

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setInitialized: () => set({ isInitialized: true }),
}));
