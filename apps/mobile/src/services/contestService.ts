import { apiRequest } from './api';
import { Contest, ContestCategory, ContestStatus } from '../types/contest';

// ─── 백엔드 응답 타입 ─────────────────────────────────────────────────────────

interface BackendContest {
  contestId: number;
  title: string;
  organizer: string;
  category: ContestCategory;
  endDate: string;
  dDay: number;
  isNew: boolean;
}

interface ContestPageResponse {
  content: BackendContest[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

interface HeartedContestsResponse {
  content: { contestId: number }[];
}

// ─── 어댑터 ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ContestCategory, string> = {
  IT: 'IT·개발',
  STARTUP: '창업·아이디어',
  DESIGN: '디자인',
  SOCIAL: '사회혁신',
  ENGINEERING: '공학',
  ARTS: '예술',
  ETC: '기타',
};

function getContestStatus(dDay: number): ContestStatus {
  if (dDay < 0) return 'CLOSED';
  if (dDay <= 7) return 'DEADLINE_SOON';
  return 'ONGOING';
}

function adaptContest(c: BackendContest): Contest {
  return {
    ...c,
    categoryLabel: CATEGORY_LABELS[c.category] ?? c.category,
    status: getContestStatus(c.dDay),
    isHearted: false, // 하트 목록 로드 후 덮어씀
  };
}

// ─── 공모전 목록 조회 ─────────────────────────────────────────────────────────

export interface ContestListParams {
  category?: ContestCategory;
  status?: ContestStatus;
  keyword?: string;
  page?: number;
  size?: number;
}

export const getContests = async (params?: ContestListParams): Promise<Contest[]> => {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);
  if (params?.keyword) query.set('keyword', params.keyword);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 100));

  const data = await apiRequest<ContestPageResponse>(`/contests?${query.toString()}`);
  return data.content.map(adaptContest);
};

export const getPopularContests = async (): Promise<Contest[]> => {
  const data = await apiRequest<{ contests: Omit<BackendContest, 'isNew'>[] }>(
    '/contests/popular',
  );
  return data.contests.map((c) => adaptContest({ ...c, isNew: false }));
};

export const getContestById = (contestId: number): Promise<Contest> =>
  apiRequest<Contest>(`/contests/${contestId}`);

// ─── 관심 공모전 조회 ─────────────────────────────────────────────────────────

export const getHeartedContests = async (_userId: number): Promise<number[]> => {
  const data = await apiRequest<HeartedContestsResponse>(`/users/contest-hearts`);
  return data.content.map((c) => c.contestId);
};

// ─── 하트 추가 / 취소 ─────────────────────────────────────────────────────────

export const addContestHeart = (_userId: number, contestId: number): Promise<null> =>
  apiRequest<null>(`/users/contest-hearts/${contestId}`, { method: 'POST' });

export const removeContestHeart = (_userId: number, contestId: number): Promise<null> =>
  apiRequest<null>(`/users/contest-hearts/${contestId}`, { method: 'DELETE' });
