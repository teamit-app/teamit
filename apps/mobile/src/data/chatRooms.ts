import { ChatRoom, User, Message } from '../types/message';

// 더미 사용자 목록
const dummyUser1: User = {
  id: 1,
  name: '김지수',
  avatar: '👨‍💻',
};

const dummyUser2: User = {
  id: 2,
  name: '김모집',
  avatar: '�',
};

const dummyUser3: User = {
  id: 3,
  name: '박팀장',
  avatar: '🚀',
};

const dummyUser4: User = {
  id: 4,
  name: '이팀원',
  avatar: '⭐',
};

const dummyUser5: User = {
  id: 5,
  name: '최기획자',
  avatar: '📋',
};

const dummyUser6: User = {
  id: 6,
  name: '김기획',
  avatar: '👨‍💼',
};

const dummyUser7: User = {
  id: 7,
  name: '박디자인',
  avatar: '👩‍🎨',
};

const dummyUser8: User = {
  id: 8,
  name: '이개발',
  avatar: '👨‍💻',
};

// 더미 메시지 (1:1 - 김모집과의 대화)
export const dummyDirectMessages1: Message[] = [
  {
    id: 1,
    senderId: 2,
    senderName: '김모집',
    senderAvatar: '👑',
    content: '안녕하세요! 팀에 함께 하고 싶으신가요?',
    createdAt: '2024-07-09T10:30:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '네, 좋습니다!',
    createdAt: '2024-07-09T11:00:00',
    isSent: true,
  },
];

// 더미 메시지 (1:1 - 박팀장과의 대화)
export const dummyDirectMessages2: Message[] = [
  {
    id: 1,
    senderId: 3,
    senderName: '박팀장',
    senderAvatar: '🚀',
    content: '디자이너를 찾고 있는데, 가능할까요?',
    createdAt: '2024-07-09T14:15:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '포트폴리오 좀 봐도 될까요?',
    createdAt: '2024-07-09T14:45:00',
    isSent: true,
  },
];

// 더미 메시지 (1:1 - 이팀원과의 대화)
export const dummyDirectMessages3: Message[] = [
  {
    id: 1,
    senderId: 4,
    senderName: '이팀원',
    senderAvatar: '⭐',
    content: '제의 감사합니다!',
    createdAt: '2024-07-09T15:20:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '네, 함께 하고 싶으신가요?',
    createdAt: '2024-07-09T15:50:00',
    isSent: true,
  },
];

// 더미 메시지 (1:1 - 최기획자와의 대화)
export const dummyDirectMessages4: Message[] = [
  {
    id: 1,
    senderId: 5,
    senderName: '최기획자',
    senderAvatar: '📋',
    content: '팀 소개 감사합니다!',
    createdAt: '2024-07-08T10:00:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '네, 언제 만날 수 있을까요?',
    createdAt: '2024-07-08T10:30:00',
    isSent: true,
  },
];

// 더미 메시지 (단체 - 2025 창업 아이디어 팀)
export const dummyGroupMessages1: Message[] = [
  {
    id: 1,
    senderId: 6,
    senderName: '김기획',
    senderAvatar: '👨‍💼',
    content: '내일 오전 10시에 회의 어때요?',
    createdAt: '2024-07-10T09:00:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 7,
    senderName: '박디자인',
    senderAvatar: '👩‍🎨',
    content: '좋습니다!',
    createdAt: '2024-07-10T09:30:00',
    isSent: false,
  },
  {
    id: 3,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '네, 참석하겠습니다',
    createdAt: '2024-07-10T10:00:00',
    isSent: true,
  },
];

// 더미 메시지 (단체 - AI 해커톤 우리팀)
export const dummyGroupMessages2: Message[] = [
  {
    id: 1,
    senderId: 8,
    senderName: '이개발',
    senderAvatar: '👨‍💻',
    content: '코드 리뷰 PR 올렸어요',
    createdAt: '2024-07-10T13:00:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '확인하고 피드백 드릴게요',
    createdAt: '2024-07-10T13:30:00',
    isSent: true,
  },
];

export const dummyChatRooms: ChatRoom[] = [
  // 단체 채팅
  {
    id: 1,
    type: 'group',
    name: '2025 창업 아이디어 팀',
    avatar: '🏆',
    lastMessage: '네, 참석하겠습니다',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-10T10:00:00',
    unreadCount: 5,
    participants: [dummyUser1, dummyUser6, dummyUser7, dummyUser8],
    description: '2025 창업 아이디어 팀',
  },
  {
    id: 2,
    type: 'group',
    name: 'AI 해커톤 우리팀',
    avatar: '🚀',
    lastMessage: '확인하고 피드백 드릴게요',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-10T13:30:00',
    unreadCount: 2,
    participants: [dummyUser1, dummyUser8],
    description: 'AI 해커톤 우리팀',
  },

  // 1:1 매칭 채팅
  {
    id: 3,
    type: 'direct',
    name: '김모집 (팀 리더)',
    avatar: '👑',
    lastMessage: '네, 좋습니다!',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-09T11:00:00',
    unreadCount: 2,
    participants: [dummyUser1, dummyUser2],
  },
  {
    id: 4,
    type: 'direct',
    name: '박팀장',
    avatar: '🚀',
    lastMessage: '포트폴리오 좀 봐도 될까요?',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-09T14:45:00',
    unreadCount: 1,
    participants: [dummyUser1, dummyUser3],
  },
  {
    id: 5,
    type: 'direct',
    name: '이팀원',
    avatar: '⭐',
    lastMessage: '네, 함께 하고 싶으신가요?',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-09T15:50:00',
    unreadCount: 0,
    participants: [dummyUser1, dummyUser4],
  },
  {
    id: 6,
    type: 'direct',
    name: '최기획자',
    avatar: '📋',
    lastMessage: '네, 언제 만날 수 있을까요?',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-08T10:30:00',
    unreadCount: 0,
    participants: [dummyUser1, dummyUser5],
  },
];
