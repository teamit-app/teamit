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
  LikedPost,
} from '../types/mypage';

export const getMyProfile = (): Promise<MyProfile> =>
  apiRequest<MyProfile>('/users/me');

export const updateMyProfile = (data: {
  nickname?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  regions?: { sido: string; sigungu: string | null }[];
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

export const deleteCareer = (careerItemId: number): Promise<void> =>
  apiRequest<void>(`/users/careers/${careerItemId}`, { method: 'DELETE' });

export const getPostApplicants = (postId: number): Promise<PostApplicant[]> =>
  apiRequest<PostApplicant[]>(`/users/posts/${postId}/applicants`);

export const getContestCandidates = (postId: number): Promise<PostApplicant[]> =>
  apiRequest<PostApplicant[]>(`/users/posts/${postId}/candidates`);

export const getLikedPosts = (): Promise<LikedPost[]> =>
  apiRequest<LikedPost[]>('/users/liked-posts');

export const submitEducationCert = (
  educationId: number,
  data: { docType: 'STUDENT_ID' | 'ENROLLMENT_CERT'; fileName: string },
): Promise<{ status: 'PENDING'; submittedAt: string }> =>
  apiRequest(`/users/educations/${educationId}/verification`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
