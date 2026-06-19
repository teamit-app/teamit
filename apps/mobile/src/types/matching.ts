export interface MatchingStatus {
  receivedProposalCount: number;
  appliedTeamCount: number;
  recentActivity?: {
    message: string;
    relativeTime: string;
  };
}
