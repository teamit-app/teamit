import { apiRequest } from './api';
import { PoolUser, TalentDetail } from '../types/talent';
import { EducationStatus } from '../types/mypage';

// ─── 백엔드 응답 타입 ─────────────────────────────────────────────────────────

interface BackendPoolUser {
  userId: number;
  nickname: string;
  profileImageUrl?: string | null;
  gender: 'MALE' | 'FEMALE';
  schoolName: string | null;
  major: string | null;
  status: EducationStatus | null;
  verified: boolean | null;
  skills: { skillName: string; level: number }[];
  certificates: string[];
  isMatchingActive: boolean;
}

interface UserPoolPageResponse {
  content: BackendPoolUser[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

interface HeartedUsersResponse {
  content: BackendPoolUser[];
}

// ─── 어댑터 ──────────────────────────────────────────────────────────────────

function adaptPoolUser(user: BackendPoolUser): PoolUser {
  return {
    ...user,
    schoolName: user.schoolName ?? '',
    major: user.major ?? '',
    verified: user.verified ?? false,
    isHearted: false, // 하트 목록 로드 후 덮어씀
  };
}

// ─── 인재풀 조회 ──────────────────────────────────────────────────────────────

export interface TalentPoolParams {
  skillId?: number;
  sido?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface TalentPoolPageResult {
  content: PoolUser[];
  currentPage: number;
  totalPages: number;
}

export const getTalentPool = async (params?: TalentPoolParams): Promise<TalentPoolPageResult> => {
  const query = new URLSearchParams();
  if (params?.skillId != null) query.set('skillId', String(params.skillId));
  if (params?.sido) query.set('sido', params.sido);
  if (params?.keyword) query.set('keyword', params.keyword);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 10));

  const data = await apiRequest<UserPoolPageResponse>(`/users?${query.toString()}`);
  return {
    content: data.content.map(adaptPoolUser),
    currentPage: data.currentPage,
    totalPages: data.totalPages,
  };
};

// ─── 관심 팀원 조회 ──────────────────────────────────────────────────────────

export const getHeartedTalents = async (_userId?: number): Promise<PoolUser[]> => {
  const data = await apiRequest<HeartedUsersResponse>(`/users/hearts`);
  return data.content.map((u) => ({ ...adaptPoolUser(u), isHearted: true }));
};

// ─── 하트 추가 / 취소 ─────────────────────────────────────────────────────────

export const addTalentHeart = (_userId: number, targetUserId: number): Promise<null> =>
  apiRequest<null>(`/users/hearts/${targetUserId}`, { method: 'POST' });

export const removeTalentHeart = (_userId: number, targetUserId: number): Promise<null> =>
  apiRequest<null>(`/users/hearts/${targetUserId}`, { method: 'DELETE' });

// ─── 유저 상세 프로필 조회 ────────────────────────────────────────────────────

export const getUserDetail = (userId: number): Promise<TalentDetail> =>
  apiRequest<TalentDetail>(`/users/${userId}`);
