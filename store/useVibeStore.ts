import { create } from 'zustand';
import { User } from 'firebase/auth';

interface VibeState {
  user: User | null;
  totalXP: number;
  streak: number;
  verifiedSadaqah: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTotalXP: (xp: number) => void;
  addXP: (amount: number) => void;
  setSadaqah: (status: boolean) => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  user: null,
  totalXP: 0,
  streak: 0,
  verifiedSadaqah: false,

  setUser: (user) => set({ user }),
  setTotalXP: (xp) => set({ totalXP: xp }),
  addXP: (amount) => set((state) => ({ totalXP: state.totalXP + amount })),
  setSadaqah: (status) => set({ verifiedSadaqah: status }),
}));
