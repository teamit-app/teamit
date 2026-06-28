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
}

export interface TeamMemberStatus {
  id: number;
  name: string;
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
}
