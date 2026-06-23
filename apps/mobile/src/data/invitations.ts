import { Invitation } from '../types/invitation';

export const dummyInvitations: Invitation[] = [
  {
    invitationId: 1,
    postId: 1,
    title: '끝까지 화이팅할 팀원 찾습니다!',
    currentMembers: 3,
    totalMembers: 5,
    contestName: '2026 스타트업 해커톤',
    senderName: '김팀장',
    receivedAt: '방금 전',
  },
  {
    invitationId: 2,
    postId: 2,
    title: 'AI 융합 공모전 팀원 모집합니다',
    currentMembers: 2,
    totalMembers: 4,
    contestName: 'AI 융합 공모전',
    senderName: '박리더',
    receivedAt: '5분 전',
  },
];
