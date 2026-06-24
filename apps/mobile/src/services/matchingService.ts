import { apiRequest } from './api';
import { MatchingStatus } from '../types/matching';

interface BackendMatchingStatus {
  receivedInvitationCount: number;
  appliedTeamCount: number;
}

export const getMatchingStatus = async (): Promise<MatchingStatus | null> => {
  const data = await apiRequest<BackendMatchingStatus>('/home/matching-status');

  return {
    receivedProposalCount: data.receivedInvitationCount,
    appliedTeamCount: data.appliedTeamCount,
    // recentActivity는 백엔드 미구현 — 홈 화면에서 optional 처리됨
  };
};
