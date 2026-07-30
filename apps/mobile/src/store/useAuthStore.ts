import { create } from 'zustand';
import { User } from '../types/user';
import { getMyProfile } from '../services/mypageService';
import { useMypageStore } from './useMypageStore';
import { useOnboardingStore } from './useOnboardingStore';
import { useBuildTeamStore } from './useBuildTeamStore';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  currentUserId: number | null;
  // fetchCurrentUserId()가 진행 중인 동안의 Promise. (tabs)/_layout.tsx의 마운트 이펙트와
  // 각 탭 화면의 마운트 이펙트가 동시에 currentUserId를 필요로 할 때, 먼저 시작된 조회를
  // 공유해서 기다리게 하기 위한 용도 — 이게 없으면 아직 조회가 끝나기 전에 currentUserId를
  // 읽는 쪽이 null을 "비로그인"으로 오판해 데이터를 잘못 캐싱하는 레이스 컨디션이 생긴다.
  currentUserIdReady: Promise<void> | null;
  setUser: (user: User) => void;
  setCurrentUserId: (userId: number) => void;
  logout: () => void;
  fetchCurrentUserId: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  currentUserId: null,
  currentUserIdReady: null,
  setUser: (user) => set({ user, isLoggedIn: true }),
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  logout: () => {
    // 다른 유저로 재로그인 시 이전 유저의 캐시가 남지 않도록 유저-스코프 스토어를 함께 초기화.
    // React Query 캐시는 어떤 쿼리 키를 빠뜨렸는지 매번 따질 필요 없이 통째로 비운다 —
    // 로그아웃 직후엔 어차피 재사용할 가치가 없고, 재로그인하면 다시 최신 데이터로 채워진다.
    useMypageStore.getState().reset();
    useOnboardingStore.getState().reset();
    useBuildTeamStore.getState().reset();
    queryClient.clear();
    set({ user: null, isLoggedIn: false, currentUserId: null, currentUserIdReady: null });
  },
  fetchCurrentUserId: () => {
    const inFlight = get().currentUserIdReady;
    if (inFlight) return inFlight;
    if (get().currentUserId != null) return Promise.resolve();

    const promise = (async () => {
      try {
        const profile = await getMyProfile();
        set({ currentUserId: profile.userId });
      } catch {
        // 로그인 전이거나 조회 실패 시 무시
      } finally {
        set({ currentUserIdReady: null });
      }
    })();
    set({ currentUserIdReady: promise });
    return promise;
  },
}));
