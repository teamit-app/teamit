import { create } from 'zustand';
import { User } from '../types/user';
import { getMyProfile } from '../services/mypageService';
import { useMypageStore } from './useMypageStore';
import { useOnboardingStore } from './useOnboardingStore';
import { useBuildTeamStore } from './useBuildTeamStore';
import { setUserId, trackEvent } from '../services/gtm';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  currentUserId: number | null;
  // 약관이 개정된 후 기존 가입자가 아직 재동의를 안 한 상태인지. true면 (tabs)/_layout.tsx가
  // 재동의 화면(reconsent)으로 보내서 그 화면을 벗어나지 못하게 한다(소프트락).
  needsTermsReconsent: boolean;
  // fetchCurrentUserId()가 진행 중인 동안의 Promise. (tabs)/_layout.tsx의 마운트 이펙트와
  // 각 탭 화면의 마운트 이펙트가 동시에 currentUserId를 필요로 할 때, 먼저 시작된 조회를
  // 공유해서 기다리게 하기 위한 용도 — 이게 없으면 아직 조회가 끝나기 전에 currentUserId를
  // 읽는 쪽이 null을 "비로그인"으로 오판해 데이터를 잘못 캐싱하는 레이스 컨디션이 생긴다.
  currentUserIdReady: Promise<void> | null;
  setUser: (user: User) => void;
  setCurrentUserId: (userId: number) => void;
  setNeedsTermsReconsent: (v: boolean) => void;
  logout: (reason?: 'logout' | 'withdraw') => void;
  fetchCurrentUserId: () => Promise<void>;
  refreshNeedsTermsReconsent: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  currentUserId: null,
  needsTermsReconsent: false,
  currentUserIdReady: null,
  setUser: (user) => set({ user, isLoggedIn: true }),
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
  setNeedsTermsReconsent: (v) => set({ needsTermsReconsent: v }),
  logout: (reason = 'logout') => {
    // 다른 유저로 재로그인 시 이전 유저의 캐시가 남지 않도록 유저-스코프 스토어를 함께 초기화.
    // React Query 캐시는 어떤 쿼리 키를 빠뜨렸는지 매번 따질 필요 없이 통째로 비운다 —
    // 로그아웃 직후엔 어차피 재사용할 가치가 없고, 재로그인하면 다시 최신 데이터로 채워진다.
    useMypageStore.getState().reset();
    useOnboardingStore.getState().reset();
    useBuildTeamStore.getState().reset();
    queryClient.clear();
    set({ user: null, isLoggedIn: false, currentUserId: null, needsTermsReconsent: false, currentUserIdReady: null });
    // user_id가 아직 살아있는 상태에서 이벤트를 먼저 보내야 GA4가 이 이벤트를 해당
    // 유저에게 귀속시킬 수 있다. 순서를 바꾸면(clear를 먼저 하면) 이벤트가 트리거를
    // 태우는 시점엔 이미 user_id가 null이라 "누구의" 로그아웃/탈퇴인지 알 수 없게 된다.
    trackEvent(reason);
    setUserId(null);
  },
  fetchCurrentUserId: () => {
    const inFlight = get().currentUserIdReady;
    if (inFlight) return inFlight;
    if (get().currentUserId != null) return Promise.resolve();

    const promise = (async () => {
      try {
        const profile = await getMyProfile();
        set({ currentUserId: profile.userId, needsTermsReconsent: profile.needsTermsReconsent });
      } catch {
        // 로그인 전이거나 조회 실패 시 무시
      } finally {
        set({ currentUserIdReady: null });
      }
    })();
    set({ currentUserIdReady: promise });
    return promise;
  },
  // login.tsx는 레이스컨디션 방지 목적으로 setCurrentUserId(userId)를 직접 호출해서
  // currentUserId를 곧바로 채우는데, 그러면 fetchCurrentUserId()의 "이미 채워져 있으면
  // 재조회 안 함" 가드에 걸려 needsTermsReconsent가 영영 갱신이 안 된다(로그인 직후엔
  // 재동의 화면이 안 뜨고 새로고침해야만 뜨는 버그의 원인). 그 가드와 무관하게 이건
  // 항상 다시 조회해서 갱신한다 — 기존 가입자 로그인 성공 직후에 호출해야 한다.
  refreshNeedsTermsReconsent: async () => {
    try {
      const profile = await getMyProfile();
      set({ needsTermsReconsent: profile.needsTermsReconsent });
    } catch {
      // 조회 실패해도 로그인 자체는 막지 않는다 — 다음 새로고침 등에서 다시 시도됨
    }
  },
}));
