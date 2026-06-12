import { create } from 'zustand';

interface OnboardingState {
  userId: number | null;
  setUserId: (id: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
  reset: () => set({ userId: null }),
}));
