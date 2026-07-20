import { apiRequest } from './api';
import { tokenStorage } from './tokenStorage';
import { ContestCategory } from '../types/contest';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.teamit.app/api/v1';

export interface PendingEducation {
  educationId: number;
  userId: number;
  nickname: string;
  schoolName: string;
  major: string;
  docType: 'STUDENT_ID' | 'ENROLLMENT_CERT';
  submittedAt: string;
}

export const getPendingEducations = (): Promise<PendingEducation[]> =>
  apiRequest<PendingEducation[]>('/admin/educations/pending');

export const reviewEducation = (
  educationId: number,
  data: { status: 'APPROVED' | 'REJECTED'; rejectReason?: string },
): Promise<void> =>
  apiRequest<void>(`/admin/educations/${educationId}/verification`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// 파일 응답은 ApiResponse 봉투가 아닌 순수 바이너리라 apiRequest를 못 쓴다.
// blob을 base64 data URI로 변환해서 반환 — 웹/네이티브 <Image> 모두에서 그대로 쓸 수 있다.
export const getEducationFileUrl = async (educationId: number): Promise<string> => {
  const accessToken = await tokenStorage.getAccessToken();
  const res = await fetch(`${BASE_URL}/admin/educations/${educationId}/file`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) throw new Error('파일을 불러오지 못했습니다');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// ── 공모전 등록/수정/삭제 (관리자) ───────────────────────────────────────────

export interface AdminContest {
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

export interface ContestFormData {
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
}

export const getAdminContests = (): Promise<AdminContest[]> =>
  apiRequest<AdminContest[]>('/admin/contests');

export const createContest = (data: ContestFormData): Promise<AdminContest> =>
  apiRequest<AdminContest>('/admin/contests', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateContest = (contestId: number, data: ContestFormData): Promise<AdminContest> =>
  apiRequest<AdminContest>(`/admin/contests/${contestId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteContest = (contestId: number): Promise<void> =>
  apiRequest<void>(`/admin/contests/${contestId}`, { method: 'DELETE' });
