import { apiRequest } from './api';
import { Contest, ContestCategory, ContestStatus, ContestDetail } from '../types/contest';
import { MatchingProfileData } from '../types/mypage';

// ─── 백엔드 응답 타입 ─────────────────────────────────────────────────────────

interface BackendContest {
  contestId: number;
  title: string;
  organizer: string;
  category: ContestCategory;
  endDate: string;
  dDay: number;
  isNew: boolean;
  imageUrl?: string;
  heartCount?: number;
}

interface BackendContestDetail {
  contestId: number;
  title: string;
  organizer: string;
  category: ContestCategory;
  target?: string;
  recruitField?: string;
  prize?: string;
  startDate?: string;
  endDate: string;
  linkUrl?: string;
  content?: string;
  imageUrl?: string;
  dDay: number;
}

interface ContestPageResponse {
  content: BackendContest[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

interface HeartedContestsResponse {
  content: BackendContest[];
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
  MARKETING: '마케팅',
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
    isRegisteredAsParticipant: false, // 참가 후보 등록 목록 로드 후 덮어씀
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

export const getContestDetail = async (contestId: number): Promise<ContestDetail> => {
  const c = await apiRequest<BackendContestDetail>(`/contests/${contestId}`);
  const period =
    c.startDate && c.endDate
      ? `${c.startDate.replace(/-/g, '.')} ~ ${c.endDate.replace(/-/g, '.')}`
      : c.endDate?.replace(/-/g, '.') ?? '';
  return {
    contestId: c.contestId,
    title: c.title,
    organizer: c.organizer,
    category: c.category,
    categoryLabel: CATEGORY_LABELS[c.category] ?? c.category,
    status: getContestStatus(c.dDay),
    endDate: c.endDate,
    dDay: c.dDay,
    isNew: false,
    isHearted: false,
    isRegisteredAsParticipant: false,
    targetAudience: c.target ?? '',
    fields: c.recruitField ?? '',
    prizeScale: c.prize ?? '',
    registrationPeriod: period,
    registrationUrl: c.linkUrl ?? '',
    hasRegisteredForMatching: false,
    content: c.content ?? '',
    imageUrl: c.imageUrl ?? undefined,
  };
};

// ─── 관심 공모전 조회 ─────────────────────────────────────────────────────────

export const getHeartedContests = async (_userId?: number): Promise<Contest[]> => {
  const data = await apiRequest<HeartedContestsResponse>(`/users/contest-hearts`);
  return data.content.map((c) => ({ ...adaptContest(c), isHearted: true }));
};

// ─── 하트 추가 / 취소 ─────────────────────────────────────────────────────────

export const addContestHeart = (_userId: number, contestId: number): Promise<null> =>
  apiRequest<null>(`/users/contest-hearts/${contestId}`, { method: 'POST' });

export const removeContestHeart = (_userId: number, contestId: number): Promise<null> =>
  apiRequest<null>(`/users/contest-hearts/${contestId}`, { method: 'DELETE' });

export interface CreatePostRequest {
  contestId: number;
  postType: 'CONTEST' | 'STARTUP' | 'PROJECT';
  recruitMode: 'BUILD' | 'JOIN';
  title: string;
  description: string;
  recruitCount: number;
  genderCondition: 'ANY' | 'SAME' | 'OPPOSITE';
  schoolCondition: 'ANY' | 'SAME_SCHOOL';
  onlineOffline: 'ONLINE' | 'OFFLINE' | 'MIXED';
  deadline: string;
  requiredSkills: Array<{ skillId: number | null; skillNameCustom?: string }>;
  experienceCondition?: string;
  purposeCondition?: string;
}

export interface CreatePostResponse {
  postId: number;
  title: string;
  status: string;
}

export const createPost = (data: CreatePostRequest): Promise<CreatePostResponse> =>
  apiRequest<CreatePostResponse>('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ─── 팀 매칭 후보 등록 ────────────────────────────────────────────────────────

// card를 넘기면 그 값 그대로 참여카드 스냅샷을 만든다(라이브 매칭 프로필은 건드리지 않음).
// 안 넘기면(=card 없이 호출) 서버가 라이브 매칭 프로필을 읽어서 스냅샷을 만든다.
export const registerAsParticipant = (contestId: number, card?: MatchingProfileData): Promise<void> =>
  apiRequest<void>(`/contests/${contestId}/participants`, {
    method: 'POST',
    body: card ? JSON.stringify(card) : undefined,
  });

export const checkIsParticipant = async (contestId: number): Promise<boolean> => {
  const data = await apiRequest<{ isParticipant: boolean }>(`/contests/${contestId}/participants/me`);
  return data.isParticipant;
};

export const getMyParticipationContestIds = async (): Promise<number[]> => {
  const data = await apiRequest<{ contestIds: number[] }>('/contests/my-participations');
  return data.contestIds;
};
