import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
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
import { useAuthStore } from '../store/useAuthStore';
import { requireAuthForHeart } from '../utils/authGuard';
import { trackEvent } from '../services/gtm';

// 탐색 탭(인재풀/공모전) 데이터는 여러 화면(탐색, 상세, 좋아요 목록 등)이 공유해서 보고
// 서로 갱신해야 하는 "단일 진실 공급원"이라 쿼리 키를 고정해두고 이 파일에서만 접근한다.
export const EXPLORE_CONTESTS_KEY = ['exploreContests'] as const;
export const EXPLORE_TALENTS_KEY = ['exploreTalents'] as const;

async function fetchContests(): Promise<Contest[]> {
  const contestsPromise = getContests();
  // 로그인 유저 조회가 끝나기 전에 currentUserId를 읽으면 아직 null인 걸 "비로그인"으로
  // 오판해서 isRegisteredAsParticipant 등을 전부 false로 캐싱해버리는 레이스 컨디션을 막는다.
  await useAuthStore.getState().fetchCurrentUserId();
  const userId = useAuthStore.getState().currentUserId;
  const contests = await contestsPromise;

  if (!userId) {
    return contests.map((c) => ({ ...c, isRegisteredAsParticipant: false }));
  }

  const [heartedContests, participationIds] = await Promise.all([
    getHeartedContests().catch(() => [] as Contest[]),
    getMyParticipationContestIds().catch(() => [] as number[]),
  ]);
  const contestHeartSet = new Set(heartedContests.map((c) => c.contestId));
  const participationSet = new Set(participationIds);

  return contests.map((c) => ({
    ...c,
    isHearted: contestHeartSet.has(c.contestId),
    isRegisteredAsParticipant: participationSet.has(c.contestId),
  }));
}

async function fetchTalents(): Promise<PoolUser[]> {
  const talentsPromise = getTalentPool();
  await useAuthStore.getState().fetchCurrentUserId();
  const userId = useAuthStore.getState().currentUserId;
  const talents = await talentsPromise;

  if (!userId) return talents;

  const heartedTalents = await getHeartedTalents().catch(() => [] as PoolUser[]);
  const talentHeartSet = new Set(heartedTalents.map((t) => t.userId));
  return talents.map((t) => ({ ...t, isHearted: talentHeartSet.has(t.userId) }));
}

// 세션당 한 번만 로드하고 그 뒤로는 아래 함수들의 낙관적 캐시 패치로만 갱신한다
// (zustand의 hasLoaded 캐시와 동일한 정책).
export function useExploreContests() {
  return useQuery({ queryKey: EXPLORE_CONTESTS_KEY, queryFn: fetchContests, staleTime: Infinity });
}

export function useExploreTalents() {
  return useQuery({ queryKey: EXPLORE_TALENTS_KEY, queryFn: fetchTalents, staleTime: Infinity });
}

// "제안 받기" 토글 직후 호출 — 세션 캐시와 무관하게 인재풀 목록을 강제로 다시 불러와서,
// 로그아웃 없이도 내 인재풀 노출 여부가 바로 반영되게 한다.
export function refreshExploreTalents() {
  return queryClient.invalidateQueries({ queryKey: EXPLORE_TALENTS_KEY });
}

// 탐색 탭 재진입/탭 재탭/당겨서 새로고침 — 세 트리거 모두 이 함수 하나로 통일해서 호출한다.
// 탭 바(_layout.tsx)처럼 explore/index.tsx 컴포넌트 인스턴스에 접근할 수 없는 곳에서도
// 쓸 수 있도록 queryClient를 직접 조작한다.
export function refetchExploreData() {
  queryClient.invalidateQueries({ queryKey: EXPLORE_CONTESTS_KEY });
  queryClient.invalidateQueries({ queryKey: EXPLORE_TALENTS_KEY });
}

export function markContestParticipant(contestId: number) {
  queryClient.setQueryData<Contest[]>(EXPLORE_CONTESTS_KEY, (prev) =>
    prev?.map((c) => (c.contestId === contestId ? { ...c, isRegisteredAsParticipant: true } : c)),
  );
}

export function unmarkContestParticipant(contestId: number) {
  queryClient.setQueryData<Contest[]>(EXPLORE_CONTESTS_KEY, (prev) =>
    prev?.map((c) => (c.contestId === contestId ? { ...c, isRegisteredAsParticipant: false } : c)),
  );
}

// 매칭 프로필에서 스킬을 수정한 직후, 세션 내내 캐시되는 인재풀 목록에도 즉시 반영하기 위한 용도.
export function updateMyTalentSkills(userId: number, skills: string[]) {
  queryClient.setQueryData<PoolUser[]>(EXPLORE_TALENTS_KEY, (prev) =>
    prev?.map((t) =>
      t.userId === userId
        ? { ...t, skills: skills.map((skillName) => ({ skillName, level: 0 })) }
        : t,
    ),
  );
}

// knownCurrentState: 탐색 목록에 없는 화면(상세정보, 지원자 목록 등)에서 호출할 때
// 이미 알고 있는 현재 좋아요 상태를 넘겨주면 그걸 기준으로 토글한다.
export async function toggleTalentHeart(targetUserId: number, knownCurrentState?: boolean): Promise<void> {
  if (!requireAuthForHeart()) return;
  const userId = useAuthStore.getState().currentUserId as number;

  const cached = queryClient.getQueryData<PoolUser[]>(EXPLORE_TALENTS_KEY);
  const prevState = knownCurrentState ?? cached?.find((t) => t.userId === targetUserId)?.isHearted ?? false;

  // 낙관적 업데이트 — 탐색 목록에 로드돼 있으면 같이 갱신, 없으면 이 부분은 그냥 no-op
  queryClient.setQueryData<PoolUser[]>(EXPLORE_TALENTS_KEY, (prev) =>
    prev?.map((t) => (t.userId === targetUserId ? { ...t, isHearted: !prevState } : t)),
  );

  trackEvent(prevState ? 'unlike' : 'like', { item_type: 'talent', item_id: targetUserId });

  try {
    if (prevState) {
      await removeTalentHeart(userId, targetUserId);
    } else {
      await addTalentHeart(userId, targetUserId);
    }
  } catch (error) {
    console.error('[Explore] 팀원 하트 실패, 롤백:', error);
    queryClient.setQueryData<PoolUser[]>(EXPLORE_TALENTS_KEY, (prev) =>
      prev?.map((t) => (t.userId === targetUserId ? { ...t, isHearted: prevState } : t)),
    );
    throw error;
  }
}

export async function toggleContestHeart(contestId: number, knownCurrentState?: boolean): Promise<void> {
  if (!requireAuthForHeart()) return;
  const userId = useAuthStore.getState().currentUserId as number;

  const cached = queryClient.getQueryData<Contest[]>(EXPLORE_CONTESTS_KEY);
  const prevState = knownCurrentState ?? cached?.find((c) => c.contestId === contestId)?.isHearted ?? false;

  queryClient.setQueryData<Contest[]>(EXPLORE_CONTESTS_KEY, (prev) =>
    prev?.map((c) => (c.contestId === contestId ? { ...c, isHearted: !prevState } : c)),
  );

  trackEvent(prevState ? 'unlike' : 'like', { item_type: 'contest', item_id: contestId });

  try {
    if (prevState) {
      await removeContestHeart(userId, contestId);
    } else {
      await addContestHeart(userId, contestId);
    }
  } catch (error) {
    console.error('[Explore] 공모전 하트 실패, 롤백:', error);
    queryClient.setQueryData<Contest[]>(EXPLORE_CONTESTS_KEY, (prev) =>
      prev?.map((c) => (c.contestId === contestId ? { ...c, isHearted: prevState } : c)),
    );
    throw error;
  }
}
