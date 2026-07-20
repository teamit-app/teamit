import { Platform } from 'react-native';
import { apiRequest } from './api';
import {
  MyProfile,
  MatchingProfileData,
  NotificationSettings,
  ContestRegistration,
  PostApplication,
  ReceivedApplicationPost,
  CareerItem,
  PostApplicant,
  PostApplicantPage,
  LikedPost,
} from '../types/mypage';

export const getMyProfile = (): Promise<MyProfile> =>
  apiRequest<MyProfile>('/users/me');

// 활동 가능 지역은 매칭 프로필(saveMatchingProfile)에서만 편집한다 — 여기서 보내지 않는다.
export const updateMyProfile = (data: {
  nickname?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
}): Promise<MyProfile> =>
  apiRequest<MyProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const toggleMatchingStatus = (isMatchingActive: boolean): Promise<void> =>
  apiRequest<void>('/users/matching-status', {
    method: 'PATCH',
    body: JSON.stringify({ isMatchingActive }),
  });

export const getMatchingProfile = (): Promise<MatchingProfileData> =>
  apiRequest<MatchingProfileData>('/users/matching-profile');

export const getLatestParticipationCard = (): Promise<MatchingProfileData> =>
  apiRequest<MatchingProfileData>('/users/matching-profile/latest-submission');

export const saveMatchingProfile = (data: MatchingProfileData): Promise<void> =>
  apiRequest<void>('/users/matching-profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const getNotificationSettings = (): Promise<NotificationSettings> =>
  apiRequest<NotificationSettings>('/users/notification-settings');

export const updateNotificationSettings = (
  data: Partial<NotificationSettings>,
): Promise<NotificationSettings> =>
  apiRequest<NotificationSettings>('/users/notification-settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const getContestRegistrations = (): Promise<ContestRegistration[]> =>
  apiRequest<ContestRegistration[]>('/users/contest-registrations');

export const getPostApplications = (): Promise<PostApplication[]> =>
  apiRequest<PostApplication[]>('/users/my-applications');

export const getReceivedApplicationPosts = (): Promise<ReceivedApplicationPost[]> =>
  apiRequest<ReceivedApplicationPost[]>('/users/received-applications');

export const addContestCareer = (data: {
  contestName: string;
  roles: string[];
  startDate: string;
  endDate: string;
  awardStatus: 'AWARDED' | 'NOT_AWARDED' | 'PARTICIPATED';
}): Promise<CareerItem> =>
  apiRequest<CareerItem>('/users/careers/contests', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const addCertificateCareer = (data: {
  certName: string;
  issuingOrg: string;
  acquiredDate: string;
}): Promise<CareerItem> =>
  apiRequest<CareerItem>('/users/careers/certificates', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateContestCareer = (
  careerItemId: number,
  data: {
    contestName: string;
    roles: string[];
    startDate: string;
    endDate: string;
    awardStatus: 'AWARDED' | 'NOT_AWARDED' | 'PARTICIPATED';
  },
): Promise<CareerItem> =>
  apiRequest<CareerItem>(`/users/careers/contests/${careerItemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const updateCertificateCareer = (
  careerItemId: number,
  data: { certName: string; issuingOrg: string; acquiredDate: string },
): Promise<CareerItem> =>
  apiRequest<CareerItem>(`/users/careers/certificates/${careerItemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteCareer = (careerItemId: number): Promise<void> =>
  apiRequest<void>(`/users/careers/${careerItemId}`, { method: 'DELETE' });

export const getPostApplicants = (postId: number): Promise<PostApplicant[]> =>
  apiRequest<PostApplicant[]>(`/users/posts/${postId}/applicants`);

export const getUserCareers = (userId: number): Promise<CareerItem[]> =>
  apiRequest<CareerItem[]>(`/users/${userId}/careers`);

export const getContestCandidates = (postId: number): Promise<PostApplicant[]> =>
  apiRequest<PostApplicant[]>(`/users/posts/${postId}/candidates`);

// 매칭 조건과 무관하게 이 공모전에 등록된 모든 후보 — 초기엔 매칭된 후보가 너무 적을 수 있어
// "매칭된 후보" 아래에 전체 목록을 페이징으로 같이 보여주기 위함
export const getAllContestCandidates = (
  postId: number,
  page: number = 0,
  size: number = 10,
): Promise<PostApplicantPage> =>
  apiRequest<PostApplicantPage>(`/users/posts/${postId}/candidates/all?page=${page}&size=${size}`);

export const getLikedPosts = (): Promise<LikedPost[]> =>
  apiRequest<LikedPost[]>('/users/liked-posts');

function guessMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'heic': return 'image/heic';
    case 'webp': return 'image/webp';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

export const submitEducationCert = async (
  educationId: number,
  data: { docType: 'STUDENT_ID' | 'ENROLLMENT_CERT'; fileUri: string; fileName: string },
): Promise<{ status: 'PENDING'; submittedAt: string }> => {
  const formData = new FormData();
  formData.append('docType', data.docType);

  if (Platform.OS === 'web') {
    // 웹에서는 uri가 blob: URL이라 fetch로 실제 바이트를 받아 Blob으로 붙여야 한다
    const res = await fetch(data.fileUri);
    const blob = await res.blob();
    formData.append('file', blob, data.fileName);
  } else {
    formData.append('file', {
      uri: data.fileUri,
      name: data.fileName,
      type: guessMimeType(data.fileName),
    } as unknown as Blob);
  }

  return apiRequest(`/users/educations/${educationId}/verification`, {
    method: 'POST',
    body: formData,
  });
};

export const uploadProfileImage = async (fileUri: string, fileName: string): Promise<string> => {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // 웹에서는 uri가 blob: URL이라 fetch로 실제 바이트를 받아 Blob으로 붙여야 한다
    const res = await fetch(fileUri);
    const blob = await res.blob();
    formData.append('file', blob, fileName);
  } else {
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: guessMimeType(fileName),
    } as unknown as Blob);
  }

  const res = await apiRequest<{ profileImageUrl: string }>('/users/me/profile-image', {
    method: 'POST',
    body: formData,
  });
  return res.profileImageUrl;
};

export const cancelEducationCert = (educationId: number): Promise<void> =>
  apiRequest<void>(`/users/educations/${educationId}/verification`, { method: 'DELETE' });

export const cancelContestRegistration = (contestId: number): Promise<void> =>
  apiRequest<void>(`/contests/${contestId}/participants`, { method: 'DELETE' });

export const cancelPostApplication = (applicationId: number): Promise<void> =>
  apiRequest<void>(`/users/my-applications/${applicationId}`, { method: 'DELETE' });
