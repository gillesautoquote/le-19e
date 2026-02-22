import { create } from 'zustand';

interface CameraStore {
  theta: number;
  updateTheta: (theta: number) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  theta: 0,
  updateTheta: (theta) => set({ theta }),
}));
