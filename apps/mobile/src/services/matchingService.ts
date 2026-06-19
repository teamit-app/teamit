import { apiRequest } from './api';
import { MatchingStatus } from '../types/matching';
import { useOnboardingStore } from '../store/useOnboardingStore';

interface BackendMatchingStatus {
  receivedInvitationCount: number;
  appliedTeamCount: number;
}

export const getMatchingStatus = async (): Promise<MatchingStatus | null> => {
  const userId = useOnboardingStore.getState().userId;
  if (!userId) return null;

  const data = await apiRequest<BackendMatchingStatus>(
    `/home/matching-status?userId=${userId}`,
  );

  return {
    receivedProposalCount: data.receivedInvitationCount,
    appliedTeamCount: data.appliedTeamCount,
    // recentActivity는 백엔드 미구현 — 홈 화면에서 optional 처리됨
  };
};
