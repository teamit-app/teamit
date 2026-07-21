import { create } from 'zustand';
import { Contest } from '../types/contest';
import { PoolUser } from '../types/talent';
import {
  getContests,
  getHeartedContests,
  addContestHeart,
  removeContestHeart,
  getMyParticipationContestIds,
} from '../services/contestService';
import {
  getTalentPool,
  getHeartedTalents,
  addTalentHeart,
  removeTalentHeart,
} from '../services/talentService';
import { useAuthStore } from './useAuthStore';
import { requireAuthForHeart } from '../utils/authGuard';

interface ExploreState {
  contests: Contest[];
  talents: PoolUser[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadData: () => Promise<void>;
  markContestParticipant: (contestId: number) => void;
  unmarkContestParticipant: (contestId: number) => void;
  // 매칭 프로필에서 스킬을 수정한 직후, 세션 내내 캐시되는 인재풀 목록(talents)에도
  // 즉시 반영하기 위한 용도. 이게 없으면 탐색 탭은 세션당 한 번만 불러오는 캐시라
  // 상세정보 화면(매번 새로 조회)과 다르게 수정 전 스킬이 계속 보인다.
  updateMyTalentSkills: (userId: number, skills: string[]) => void;
  // "제안 받기" 토글 직후 호출 — hasLoaded 캐시와 무관하게 인재풀 목록을 강제로
  // 다시 불러와서, 로그아웃 없이도 내 인재풀 노출 여부가 바로 반영되게 한다.
  refreshTalents: () => Promise<void>;
  toggleContestHeart: (contestId: number, knownCurrentState?: boolean) => Promise<void>;
  // knownCurrentState: 탐색 목록에 없는 화면(상세정보, 지원자 목록 등)에서 호출할 때
  // 이미 알고 있는 현재 좋아요 상태를 넘겨주면 그걸 기준으로 토글한다.
  // 이 store가 인재 좋아요의 단일 진실 공급원 역할을 해서, 여기서 토글하면
  // 탐색 탭 목록도 함께 갱신된다(목록에 이미 로드돼 있는 경우).
  toggleTalentHeart: (targetUserId: number, knownCurrentState?: boolean) => Promise<void>;
  reset: () => void;
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  contests: [],
  talents: [],
  isLoading: false,
  hasLoaded: false,

  markContestParticipant: (contestId) => {
    set((state) => ({
      contests: state.contests.map((c) =>
        c.contestId === contestId ? { ...c, isRegisteredAsParticipant: true } : c,
      ),
    }));
  },

  unmarkContestParticipant: (contestId) => {
    set((state) => ({
      contests: state.contests.map((c) =>
        c.contestId === contestId ? { ...c, isRegisteredAsParticipant: false } : c,
      ),
    }));
  },

  updateMyTalentSkills: (userId, skills) => {
    set((state) => ({
      talents: state.talents.map((t) =>
        t.userId === userId
          ? { ...t, skills: skills.map((skillName) => ({ skillName, level: 0 })) }
          : t,
      ),
    }));
  },

  refreshTalents: async () => {
    try {
      const userId = useAuthStore.getState().currentUserId;
      const talents = await getTalentPool();
      if (userId) {
        const heartedTalents = await getHeartedTalents().catch(() => [] as PoolUser[]);
        const talentHeartSet = new Set(heartedTalents.map((t) => t.userId));
        set({ talents: talents.map((t) => ({ ...t, isHearted: talentHeartSet.has(t.userId) })) });
      } else {
        set({ talents });
      }
    } catch (error) {
      console.error('[ExploreStore] 인재풀 갱신 실패:', error);
    }
  },

  loadData: async () => {
    const { isLoading, hasLoaded } = get();
    if (isLoading || hasLoaded) return;
    set({ isLoading: true });
    try {
      // 로그인 유저 조회가 끝나기 전에 currentUserId를 읽으면 아직 null인 걸 "비로그인"으로
      // 오판해서 isRegisteredAsParticipant 등을 전부 false로 영구 캐싱해버리는 레이스
      // 컨디션이 있었다. fetchCurrentUserId()를 여기서도 기다려서 그 창을 없앤다
      // (이미 조회 중이거나 끝났으면 그 결과를 그대로 재사용하므로 중복 호출되지 않는다).
      await useAuthStore.getState().fetchCurrentUserId();
      const userId = useAuthStore.getState().currentUserId;

      const [talents, contests] = await Promise.all([getTalentPool(), getContests()]);

      // userId가 있으면 하트 목록을 로드해서 isHearted 상태를 덮어씀
      if (userId) {
        const [heartedTalents, heartedContests, participationIds] = await Promise.all([
          getHeartedTalents().catch(() => [] as PoolUser[]),
          getHeartedContests().catch(() => [] as Contest[]),
          getMyParticipationContestIds().catch(() => [] as number[]),
        ]);
        const talentHeartSet = new Set(heartedTalents.map((t) => t.userId));
        const contestHeartSet = new Set(heartedContests.map((c) => c.contestId));
        const participationSet = new Set(participationIds);

        set({
          talents: talents.map((t) => ({ ...t, isHearted: talentHeartSet.has(t.userId) })),
          contests: contests.map((c) => ({
            ...c,
            isHearted: contestHeartSet.has(c.contestId),
            isRegisteredAsParticipant: participationSet.has(c.contestId),
          })),
          hasLoaded: true,
        });
      } else {
        set({
          talents,
          contests: contests.map((c) => ({ ...c, isRegisteredAsParticipant: false })),
          hasLoaded: true,
        });
      }
    } catch (error) {
      console.error('[ExploreStore] 데이터 로드 실패:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleTalentHeart: async (targetUserId: number, knownCurrentState?: boolean) => {
    if (!requireAuthForHeart()) return;
    const userId = useAuthStore.getState().currentUserId as number;

    const prevState = knownCurrentState
      ?? get().talents.find((t) => t.userId === targetUserId)?.isHearted
      ?? false;

    // 낙관적 업데이트 — 탐색 목록에 로드돼 있으면 같이 갱신, 없으면 이 부분은 그냥 no-op
    set((state) => ({
      talents: state.talents.map((t) =>
        t.userId === targetUserId ? { ...t, isHearted: !prevState } : t,
      ),
    }));

    try {
      if (prevState) {
        await removeTalentHeart(userId, targetUserId);
      } else {
        await addTalentHeart(userId, targetUserId);
      }
    } catch (error) {
      console.error('[ExploreStore] 팀원 하트 실패, 롤백:', error);
      // 실패 시 롤백
      set((state) => ({
        talents: state.talents.map((t) =>
          t.userId === targetUserId ? { ...t, isHearted: prevState } : t,
        ),
      }));
      throw error;
    }
  },

  toggleContestHeart: async (contestId: number, knownCurrentState?: boolean) => {
    if (!requireAuthForHeart()) return;
    const userId = useAuthStore.getState().currentUserId as number;

    const prevState = knownCurrentState
      ?? get().contests.find((c) => c.contestId === contestId)?.isHearted
      ?? false;

    // 낙관적 업데이트 — 탐색 목록에 로드돼 있으면 같이 갱신, 없으면 이 부분은 그냥 no-op
    set((state) => ({
      contests: state.contests.map((c) =>
        c.contestId === contestId ? { ...c, isHearted: !prevState } : c,
      ),
    }));

    try {
      if (prevState) {
        await removeContestHeart(userId, contestId);
      } else {
        await addContestHeart(userId, contestId);
      }
    } catch (error) {
      console.error('[ExploreStore] 공모전 하트 실패, 롤백:', error);
      // 실패 시 롤백
      set((state) => ({
        contests: state.contests.map((c) =>
          c.contestId === contestId ? { ...c, isHearted: prevState } : c,
        ),
      }));
      throw error;
    }
  },

  reset: () => set({ contests: [], talents: [], isLoading: false, hasLoaded: false }),
}));
