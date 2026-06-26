import { create } from 'zustand';
import { MyProfile, MatchingProfileData, CareerItem } from '../types/mypage';
import {
  getMyProfile,
  toggleMatchingStatus,
  getMatchingProfile,
  saveMatchingProfile,
  deleteCareer,
} from '../services/mypageService';

interface MypageState {
  profile: MyProfile | null;
  matchingProfile: MatchingProfileData | null;
  isLoading: boolean;
  hasLoaded: boolean;

  loadProfile: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  setMatchingActive: (active: boolean) => Promise<void>;
  loadMatchingProfile: () => Promise<void>;
  updateMatchingProfile: (data: MatchingProfileData) => Promise<void>;
  removeCareer: (careerItemId: number) => Promise<void>;
  addCareerLocal: (item: CareerItem) => void;
}

export const useMypageStore = create<MypageState>((set, get) => ({
  profile: null,
  matchingProfile: null,
  isLoading: false,
  hasLoaded: false,

  loadProfile: async () => {
    if (get().isLoading || get().hasLoaded) return;
    set({ isLoading: true });
    try {
      const profile = await getMyProfile();
      set({ profile, hasLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },

  reloadProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await getMyProfile();
      set({ profile });
    } finally {
      set({ isLoading: false });
    }
  },

  setMatchingActive: async (active) => {
    await toggleMatchingStatus(active);
    set((s) => ({
      profile: s.profile ? { ...s.profile, isMatchingActive: active } : null,
    }));
  },

  loadMatchingProfile: async () => {
    if (get().matchingProfile) return;
    const data = await getMatchingProfile();
    set({ matchingProfile: data });
  },

  updateMatchingProfile: async (data) => {
    await saveMatchingProfile(data);
    set({ matchingProfile: data });
  },

  removeCareer: async (careerItemId) => {
    await deleteCareer(careerItemId);
    set((s) => ({
      profile: s.profile
        ? {
            ...s.profile,
            careers: s.profile.careers.filter((c) => c.careerItemId !== careerItemId),
          }
        : null,
    }));
  },

  addCareerLocal: (item) => {
    set((s) => ({
      profile: s.profile
        ? { ...s.profile, careers: [...s.profile.careers, item] }
        : null,
    }));
  },
}));
