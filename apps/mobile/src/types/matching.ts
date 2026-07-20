export interface MatchingStatus {
  receivedInvitationCount: number;
  myPostApplicantCount: number;
  recentActivity?: {
    message: string;
    relativeTime: string;
  };
}
