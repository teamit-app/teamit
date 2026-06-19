import { create } from 'zustand';
import { Contest } from '../types/contest';
import { PoolUser } from '../types/talent';
import {
  getContests,
  getHeartedContests,
  addContestHeart,
  removeContestHeart,
} from '../services/contestService';
import {
  getTalentPool,
  getHeartedTalents,
  addTalentHeart,
  removeTalentHeart,
} from '../services/talentService';
import { useOnboardingStore } from './useOnboardingStore';

interface ExploreState {
  contests: Contest[];
  talents: PoolUser[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadData: () => Promise<void>;
  toggleContestHeart: (contestId: number) => Promise<void>;
  toggleTalentHeart: (targetUserId: number) => Promise<void>;
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  contests: [],
  talents: [],
  isLoading: false,
  hasLoaded: false,

  loadData: async () => {
    const { isLoading, hasLoaded } = get();
    if (isLoading || hasLoaded) return;
    set({ isLoading: true });
    try {
      const userId = useOnboardingStore.getState().userId;

      const [talents, contests] = await Promise.all([getTalentPool(), getContests()]);

      // userId가 있으면 하트 목록을 로드해서 isHearted 상태를 덮어씀
      if (userId) {
        const [heartedTalentIds, heartedContestIds] = await Promise.all([
          getHeartedTalents(userId).catch(() => [] as number[]),
          getHeartedContests(userId).catch(() => [] as number[]),
        ]);
        const talentHeartSet = new Set(heartedTalentIds);
        const contestHeartSet = new Set(heartedContestIds);

        set({
          talents: talents.map((t) => ({ ...t, isHearted: talentHeartSet.has(t.userId) })),
          contests: contests.map((c) => ({ ...c, isHearted: contestHeartSet.has(c.contestId) })),
          hasLoaded: true,
        });
      } else {
        set({ talents, contests, hasLoaded: true });
      }
    } catch (error) {
      console.error('[ExploreStore] 데이터 로드 실패:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleTalentHeart: async (targetUserId: number) => {
    const userId = useOnboardingStore.getState().userId;
    if (!userId) return;

    const prevState = get().talents.find((t) => t.userId === targetUserId)?.isHearted ?? false;

    // 낙관적 업데이트
    set((state) => ({
      talents: state.talents.map((t) =>
        t.userId === targetUserId ? { ...t, isHearted: !t.isHearted } : t,
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
    }
  },

  toggleContestHeart: async (contestId: number) => {
    const userId = useOnboardingStore.getState().userId;
    if (!userId) return;

    const prevState = get().contests.find((c) => c.contestId === contestId)?.isHearted ?? false;

    // 낙관적 업데이트
    set((state) => ({
      contests: state.contests.map((c) =>
        c.contestId === contestId ? { ...c, isHearted: !c.isHearted } : c,
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
    }
  },
}));
