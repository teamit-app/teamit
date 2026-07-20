import { apiRequest } from './api';
import { MatchingStatus } from '../types/matching';

interface BackendMatchingStatus {
  receivedInvitationCount: number;
  myPostApplicantCount: number;
}

export const getMatchingStatus = async (): Promise<MatchingStatus | null> => {
  const data = await apiRequest<BackendMatchingStatus>('/home/matching-status');

  return {
    receivedInvitationCount: data.receivedInvitationCount,
    myPostApplicantCount: data.myPostApplicantCount,
    // recentActivity는 백엔드 미구현 — 홈 화면에서 optional 처리됨
  };
};
