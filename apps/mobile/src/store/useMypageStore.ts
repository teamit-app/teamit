import { create } from 'zustand';
import { MyProfile, MatchingProfileData, CareerItem, UserEducation } from '../types/mypage';
import {
  getMyProfile,
  toggleMatchingStatus,
  getMatchingProfile,
  saveMatchingProfile,
  getLatestParticipationCard,
  deleteCareer,
} from '../services/mypageService';

interface MypageState {
  profile: MyProfile | null;
  matchingProfile: MatchingProfileData | null;
  latestParticipationCard: MatchingProfileData | null;
  // 공모전 후보 등록(participate)·팀 직접 꾸리기(build-team) 플로우 전용 임시 카드.
  // 이 플로우에서 "수정"을 눌러 매칭 프로필 항목을 고쳐도 라이브 matchingProfile은
  // 절대 안 건드리고 여기에만 담아뒀다가, 등록/모집글 생성 시점에 스냅샷으로만 반영한다.
  // 매칭 프로필은 오직 마이페이지에서 직접 들어가서 편집할 때만 바뀌어야 하기 때문.
  draftCard: MatchingProfileData | null;
  isLoading: boolean;
  hasLoaded: boolean;

  loadProfile: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  setMatchingActive: (active: boolean) => Promise<void>;
  loadMatchingProfile: () => Promise<void>;
  updateMatchingProfile: (data: MatchingProfileData) => Promise<void>;
  loadLatestParticipationCard: () => Promise<void>;
  setDraftCard: (data: MatchingProfileData) => void;
  clearDraftCard: () => void;
  removeCareer: (careerItemId: number) => Promise<void>;
  addCareerLocal: (item: CareerItem) => void;
  updateCareerLocal: (item: CareerItem) => void;
  updateEducationLocal: (education: UserEducation) => void;
  reset: () => void;
}

export const useMypageStore = create<MypageState>((set, get) => ({
  profile: null,
  matchingProfile: null,
  latestParticipationCard: null,
  draftCard: null,
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

  loadLatestParticipationCard: async () => {
    if (get().latestParticipationCard) return;
    const data = await getLatestParticipationCard();
    set({ latestParticipationCard: data });
  },

  setDraftCard: (data) => set({ draftCard: data }),
  clearDraftCard: () => set({ draftCard: null }),

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

  updateCareerLocal: (item) => {
    set((s) => ({
      profile: s.profile
        ? {
            ...s.profile,
            careers: s.profile.careers.map((c) =>
              c.careerItemId === item.careerItemId ? item : c,
            ),
          }
        : null,
    }));
  },

  updateEducationLocal: (education) => {
    set((s) => ({
      profile: s.profile ? { ...s.profile, education } : null,
    }));
  },

  reset: () => set({
    profile: null,
    matchingProfile: null,
    latestParticipationCard: null,
    draftCard: null,
    isLoading: false,
    hasLoaded: false,
  }),
}));
