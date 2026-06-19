import { apiRequest } from './api';
import { PoolUser } from '../types/talent';

// ─── 백엔드 응답 타입 ─────────────────────────────────────────────────────────

interface BackendPoolUser {
  userId: number;
  nickname: string;
  gender: 'MALE' | 'FEMALE';
  schoolName: string | null;
  major: string | null;
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
  content: { userId: number }[];
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

export const getTalentPool = async (params?: TalentPoolParams): Promise<PoolUser[]> => {
  const query = new URLSearchParams();
  if (params?.skillId != null) query.set('skillId', String(params.skillId));
  if (params?.sido) query.set('sido', params.sido);
  if (params?.keyword) query.set('keyword', params.keyword);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 100));

  const data = await apiRequest<UserPoolPageResponse>(`/users?${query.toString()}`);
  return data.content.map(adaptPoolUser);
};

// ─── 관심 팀원 조회 ──────────────────────────────────────────────────────────

export const getHeartedTalents = async (userId: number): Promise<number[]> => {
  const data = await apiRequest<HeartedUsersResponse>(`/users/${userId}/hearts`);
  return data.content.map((u) => u.userId);
};

// ─── 하트 추가 / 취소 ─────────────────────────────────────────────────────────

export const addTalentHeart = (userId: number, targetUserId: number): Promise<null> =>
  apiRequest<null>(`/users/${userId}/hearts/${targetUserId}`, { method: 'POST' });

export const removeTalentHeart = (userId: number, targetUserId: number): Promise<null> =>
  apiRequest<null>(`/users/${userId}/hearts/${targetUserId}`, { method: 'DELETE' });
