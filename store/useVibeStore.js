import { create } from 'zustand';

export const useVibeStore = create((set) => ({
  user: null,
  totalXP: 0,
  streak: 0,
  verifiedSadaqah: false,
  
  // Actions
  setUser: (user) => set({ user }),
  setTotalXP: (xp) => set({ totalXP: xp }),
  addXP: (amount) => set((state) => ({ totalXP: state.totalXP + amount })),
  setSadaqah: (status) => set({ verifiedSadaqah: status }),
}));
