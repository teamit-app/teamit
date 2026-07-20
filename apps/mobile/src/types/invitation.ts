export interface Invitation {
  invitationId: number;
  postId: number;
  title: string;
  currentMembers: number;
  totalMembers: number;
  contestName: string;
  senderName: string;
  receivedAt: string;
}
