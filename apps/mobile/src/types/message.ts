export interface User {
  id: number;
  name: string;
  avatar: string;
}

export interface InvitationCardData {
  title: string;
  currentMembers: number;
  totalMembers: number;
  contestName: string;
  senderName: string;
  postId?: number;
  invitationId?: number;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: string;
  isSent: boolean; // 현재 사용자가 보낸 메시지인지 여부
  isSystem?: boolean;
  invitationCard?: InvitationCardData;
}

export interface ChatRoom {
  id: number;
  type: 'group' | 'direct';
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageBy: string; // 마지막 메시지를 보낸 사람 이름
  lastMessageAt: string;
  unreadCount: number;
  participants: User[];
  description?: string; // 단체 채팅의 경우
  detailType?: 'member-invite' | 'leader-request' | 'group-status' | 'normal';
  matchStatus?: 'pending' | 'accepted' | 'requested' | 'waiting' | 'completed' | 'none';
  teamInfo?: TeamInfo;
  postId?: number; // 이 채팅방과 연결된 모집글 ID (GROUP 채팅방만)
  opponentUserId?: number; // 상대방 userId (DIRECT 채팅방만)
}

export interface TeamMemberStatus {
  id: number;
  name: string;
  realName?: string; // 리뷰 작성 시 "닉네임(본명)"으로 표기하기 위한 실명
  role: string;
  avatar: string;
  filled: boolean;
  isHost?: boolean; // true = 이 채팅방의 모집자(팀장)
}

export interface TeamInfo {
  statusLabel: string;
  title: string;
  currentCount: number;
  totalCount: number;
  members: TeamMemberStatus[];
  dDay?: number;
  isExpired?: boolean; // 공모전 기한이 지나 리뷰 작성 가능한 상태
  teamConfirmed?: boolean; // 모집자가 팀원을 확정했는지 (팀 현황 UI용, isExpired와 별개)
  postTitle?: string;
  contestId?: number;
  contestTitle?: string;
}

export interface Chat {
  id: number;
  type: 'group' | 'direct';
  name: string;
  avatar: string;
  participants: User[];
  messages: Message[];
  description?: string;
  detailType?: 'member-invite' | 'leader-request' | 'group-status' | 'normal';
  matchStatus?: 'pending' | 'accepted' | 'requested' | 'waiting' | 'completed' | 'none';
  teamInfo?: TeamInfo;
  postId?: number; // 이 채팅방과 연결된 모집글 ID (GROUP 채팅방만)
}
