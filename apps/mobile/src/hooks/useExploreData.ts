import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { Contest, ContestCategory } from '../types/contest';
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
import { getPostsPage, PostListItem } from '../services/postService';
import { useAuthStore } from '../store/useAuthStore';
import { requireAuthForHeart } from '../utils/authGuard';
import { trackEvent } from '../services/gtm';

// 탐색 탭(인재풀/공모전/모집글) 데이터는 여러 화면(탐색, 상세, 좋아요 목록 등)이 공유해서 보고
// 서로 갱신해야 하는 "단일 진실 공급원"이라 쿼리 키를 고정해두고 이 파일에서만 접근한다.
// 무한스크롤 페이지당 개수 — 세 탭 모두 동일하게 맞춘다.
const PAGE_SIZE = 10;

// 필터가 바뀌면(카테고리/정렬/검색어) 완전히 다른 쿼리로 취급해 0페이지부터 다시 불러온다.
// 나머지 부분(예: 'exploreContests')만으로 invalidate/setQueriesData하면 필터별로 갈라진
// 캐시를 한 번에 다 갱신할 수 있다(React Query의 쿼리 키 prefix 매칭).
const EXPLORE_CONTESTS_BASE_KEY = ['exploreContests'] as const;
const EXPLORE_TALENTS_BASE_KEY = ['exploreTalents'] as const;
const EXPLORE_POSTS_BASE_KEY = ['explorePosts'] as const;

type ContestPage = { content: Contest[]; currentPage: number; totalPages: number };
type TalentPage = { content: PoolUser[]; currentPage: number; totalPages: number };
type PostPage = { content: PostListItem[]; currentPage: number; totalPages: number };

function getNextPageParam(lastPage: { currentPage: number; totalPages: number }) {
  return lastPage.currentPage + 1 < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
}

async function fetchContestsPage(pageParam: number, category?: ContestCategory, keyword?: string): Promise<ContestPage> {
  const contestsPromise = getContests({ category, keyword, page: pageParam, size: PAGE_SIZE });
  // 로그인 유저 조회가 끝나기 전에 currentUserId를 읽으면 아직 null인 걸 "비로그인"으로
  // 오판해서 isRegisteredAsParticipant 등을 전부 false로 캐싱해버리는 레이스 컨디션을 막는다.
  await useAuthStore.getState().fetchCurrentUserId();
  const userId = useAuthStore.getState().currentUserId;
  const { content, currentPage, totalPages } = await contestsPromise;

  if (!userId) {
    return { content: content.map((c) => ({ ...c, isRegisteredAsParticipant: false })), currentPage, totalPages };
  }

  const [heartedContests, participationIds] = await Promise.all([
    getHeartedContests().catch(() => [] as Contest[]),
    getMyParticipationContestIds().catch(() => [] as number[]),
  ]);
  const contestHeartSet = new Set(heartedContests.map((c) => c.contestId));
  const participationSet = new Set(participationIds);

  return {
    content: content.map((c) => ({
      ...c,
      isHearted: contestHeartSet.has(c.contestId),
      isRegisteredAsParticipant: participationSet.has(c.contestId),
    })),
    currentPage,
    totalPages,
  };
}

async function fetchTalentsPage(pageParam: number, keyword?: string): Promise<TalentPage> {
  const talentsPromise = getTalentPool({ keyword, page: pageParam, size: PAGE_SIZE });
  await useAuthStore.getState().fetchCurrentUserId();
  const userId = useAuthStore.getState().currentUserId;
  const { content, currentPage, totalPages } = await talentsPromise;

  if (!userId) return { content, currentPage, totalPages };

  const heartedTalents = await getHeartedTalents().catch(() => [] as PoolUser[]);
  const talentHeartSet = new Set(heartedTalents.map((t) => t.userId));
  return {
    content: content.map((t) => ({ ...t, isHearted: talentHeartSet.has(t.userId) })),
    currentPage,
    totalPages,
  };
}

async function fetchPostsPage(pageParam: number, sort: 'LATEST' | 'POPULAR', keyword?: string): Promise<PostPage> {
  return getPostsPage({ sort, keyword, page: pageParam, size: PAGE_SIZE });
}

// category/keyword가 바뀔 때마다 각각 독립된 쿼리로 캐싱해서, 필터를 왔다갔다해도 이전에
// 로드했던 페이지들을 다시 쓸 수 있게 한다. 검색어는 서버가 keyword 파라미터로 전체
// 데이터셋에서 필터링해주므로(지금까지 로드한 페이지 안에서만 찾는 게 아님), 호출하는 쪽에서
// 타이핑이 멈춘 뒤(debounce) 값을 넘겨야 매 키 입력마다 새 쿼리가 뜨지 않는다.
export function useExploreContests(category?: ContestCategory, keyword?: string) {
  return useInfiniteQuery({
    queryKey: [...EXPLORE_CONTESTS_BASE_KEY, category ?? 'ALL', keyword ?? ''],
    queryFn: ({ pageParam }) => fetchContestsPage(pageParam, category, keyword),
    initialPageParam: 0,
    getNextPageParam,
    staleTime: Infinity,
  });
}

export function useExploreTalents(keyword?: string) {
  return useInfiniteQuery({
    queryKey: [...EXPLORE_TALENTS_BASE_KEY, keyword ?? ''],
    queryFn: ({ pageParam }) => fetchTalentsPage(pageParam, keyword),
    initialPageParam: 0,
    getNextPageParam,
    staleTime: Infinity,
  });
}

export function useExplorePosts(sort: 'LATEST' | 'POPULAR', keyword?: string) {
  return useInfiniteQuery({
    queryKey: [...EXPLORE_POSTS_BASE_KEY, sort, keyword ?? ''],
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam, sort, keyword),
    initialPageParam: 0,
    getNextPageParam,
    staleTime: Infinity,
  });
}

// "제안 받기" 토글 직후 호출 — 세션 캐시와 무관하게 인재풀 목록을 강제로 다시 불러와서,
// 로그아웃 없이도 내 인재풀 노출 여부가 바로 반영되게 한다.
export function refreshExploreTalents() {
  return queryClient.invalidateQueries({ queryKey: EXPLORE_TALENTS_BASE_KEY });
}

// 탐색 탭 재진입/탭 재탭/당겨서 새로고침 — 세 트리거 모두 이 함수 하나로 통일해서 호출한다.
// 탭 바(_layout.tsx)처럼 explore/index.tsx 컴포넌트 인스턴스에 접근할 수 없는 곳에서도
// 쓸 수 있도록 queryClient를 직접 조작한다. prefix 키라 카테고리/정렬/검색어별로 갈라진
// 캐시가 전부 한 번에 무효화된다.
export function refetchExploreData() {
  queryClient.invalidateQueries({ queryKey: EXPLORE_CONTESTS_BASE_KEY });
  queryClient.invalidateQueries({ queryKey: EXPLORE_TALENTS_BASE_KEY });
  queryClient.invalidateQueries({ queryKey: EXPLORE_POSTS_BASE_KEY });
}

// 무한스크롤 도입 후 데이터가 InfiniteData<Page> 형태(pages[].content[])로 바뀌어서,
// 낙관적 캐시 패치도 모든 페이지를 순회하며 적용해야 한다. prefix 키로 setQueriesData를
// 쓰면 카테고리/검색어별로 갈라진 쿼리들도 한 번에 같이 갱신된다.
function patchContestInAllPages(contestId: number, updater: (c: Contest) => Contest) {
  queryClient.setQueriesData<InfiniteData<ContestPage>>(
    { queryKey: EXPLORE_CONTESTS_BASE_KEY },
    (data) => {
      if (!data) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          content: page.content.map((c) => (c.contestId === contestId ? updater(c) : c)),
        })),
      };
    },
  );
}

function patchTalentInAllPages(userId: number, updater: (t: PoolUser) => PoolUser) {
  queryClient.setQueriesData<InfiniteData<TalentPage>>(
    { queryKey: EXPLORE_TALENTS_BASE_KEY },
    (data) => {
      if (!data) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          content: page.content.map((t) => (t.userId === userId ? updater(t) : t)),
        })),
      };
    },
  );
}

function findContestInCache(contestId: number): Contest | undefined {
  const caches = queryClient.getQueriesData<InfiniteData<ContestPage>>({ queryKey: EXPLORE_CONTESTS_BASE_KEY });
  for (const [, data] of caches) {
    const found = data?.pages.flatMap((p) => p.content).find((c) => c.contestId === contestId);
    if (found) return found;
  }
  return undefined;
}

function findTalentInCache(userId: number): PoolUser | undefined {
  const caches = queryClient.getQueriesData<InfiniteData<TalentPage>>({ queryKey: EXPLORE_TALENTS_BASE_KEY });
  for (const [, data] of caches) {
    const found = data?.pages.flatMap((p) => p.content).find((t) => t.userId === userId);
    if (found) return found;
  }
  return undefined;
}

export function markContestParticipant(contestId: number) {
  patchContestInAllPages(contestId, (c) => ({ ...c, isRegisteredAsParticipant: true }));
}

export function unmarkContestParticipant(contestId: number) {
  patchContestInAllPages(contestId, (c) => ({ ...c, isRegisteredAsParticipant: false }));
}

// 매칭 프로필에서 스킬을 수정한 직후, 세션 내내 캐시되는 인재풀 목록에도 즉시 반영하기 위한 용도.
export function updateMyTalentSkills(userId: number, skills: string[]) {
  patchTalentInAllPages(userId, (t) => ({
    ...t,
    skills: skills.map((skillName) => ({ skillName, level: 0 })),
  }));
}

// knownCurrentState: 탐색 목록에 없는 화면(상세정보, 지원자 목록 등)에서 호출할 때
// 이미 알고 있는 현재 좋아요 상태를 넘겨주면 그걸 기준으로 토글한다.
export async function toggleTalentHeart(targetUserId: number, knownCurrentState?: boolean): Promise<void> {
  if (!requireAuthForHeart()) return;
  const userId = useAuthStore.getState().currentUserId as number;

  const prevState = knownCurrentState ?? findTalentInCache(targetUserId)?.isHearted ?? false;

  // 낙관적 업데이트 — 탐색 목록에 로드돼 있으면 같이 갱신, 없으면 이 부분은 그냥 no-op
  patchTalentInAllPages(targetUserId, (t) => ({ ...t, isHearted: !prevState }));

  trackEvent(prevState ? 'unlike' : 'like', { item_type: 'talent', item_id: targetUserId });

  try {
    if (prevState) {
      await removeTalentHeart(userId, targetUserId);
    } else {
      await addTalentHeart(userId, targetUserId);
    }
  } catch (error) {
    console.error('[Explore] 팀원 하트 실패, 롤백:', error);
    patchTalentInAllPages(targetUserId, (t) => ({ ...t, isHearted: prevState }));
    throw error;
  }
}

export async function toggleContestHeart(contestId: number, knownCurrentState?: boolean): Promise<void> {
  if (!requireAuthForHeart()) return;
  const userId = useAuthStore.getState().currentUserId as number;

  const prevState = knownCurrentState ?? findContestInCache(contestId)?.isHearted ?? false;

  patchContestInAllPages(contestId, (c) => ({ ...c, isHearted: !prevState }));

  trackEvent(prevState ? 'unlike' : 'like', { item_type: 'contest', item_id: contestId });

  try {
    if (prevState) {
      await removeContestHeart(userId, contestId);
    } else {
      await addContestHeart(userId, contestId);
    }
  } catch (error) {
    console.error('[Explore] 공모전 하트 실패, 롤백:', error);
    patchContestInAllPages(contestId, (c) => ({ ...c, isHearted: prevState }));
    throw error;
  }
}
