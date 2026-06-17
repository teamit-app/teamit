import { create } from 'zustand';
import { Contest } from '../types/contest';
import { PoolUser } from '../types/talent';
import { getContests } from '../services/contestService';
import { getTalentPool } from '../services/talentService';

interface ExploreState {
  contests: Contest[];
  talents: PoolUser[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadData: () => Promise<void>;
  toggleContestHeart: (contestId: number) => void;
  toggleTalentHeart: (userId: number) => void;
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
      const [contests, talents] = await Promise.all([getContests(), getTalentPool()]);
      set({ contests, talents, hasLoaded: true });
    } finally {
      set({ isLoading: false });
    }
  },
  toggleContestHeart: (contestId) =>
    set((state) => ({
      contests: state.contests.map((c) =>
        c.contestId === contestId ? { ...c, isHearted: !c.isHearted } : c,
      ),
    })),
  toggleTalentHeart: (userId) =>
    set((state) => ({
      talents: state.talents.map((t) =>
        t.userId === userId ? { ...t, isHearted: !t.isHearted } : t,
      ),
    })),
}));
