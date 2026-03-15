import { create } from 'zustand';
import { User } from 'firebase/auth';

interface VibeState {
  user: User | null;
  userRole: string;
  totalXP: number;
  streak: number;
  photoURL: string | null;
  verifiedSadaqah: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setPhotoURL: (url: string | null) => void;
  setUserRole: (role: string) => void;
  setTotalXP: (xp: number) => void;
  addXP: (amount: number) => void;
  setSadaqah: (status: boolean) => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  user: null,
  userRole: 'student',
  totalXP: 0,
  streak: 0,
  photoURL: null,
  verifiedSadaqah: false,

  setUser: (user) => set({ user }),
  setPhotoURL: (url) => set({ photoURL: url }),
  setUserRole: (role) => set({ userRole: role }),
  setTotalXP: (xp) => set({ totalXP: xp }),
  addXP: (amount) => set((state) => ({ totalXP: state.totalXP + amount })),
  setSadaqah: (status) => set({ verifiedSadaqah: status }),
}));
