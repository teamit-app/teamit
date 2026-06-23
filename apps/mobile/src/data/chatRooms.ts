import { ChatRoom, User, Message } from '../types/message';

const minsAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

// 더미 사용자 목록
const dummyUser1: User = {
  id: 1,
  name: '김지수',
  avatar: '👨‍💻',
};

const dummyUser2: User = {
  id: 2,
  name: '김모집',
  avatar: '👑',
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
    content: '네, 관심 있어요! 현재 팀 모집 상황 공유 부탁드려요.',
    createdAt: '2024-07-09T10:32:00',
    isSent: true,
  },
  {
    id: 3,
    senderId: 2,
    senderName: '김모집',
    senderAvatar: '👑',
    content: '저희는 AI 해커톤 팀이에요! 개발자 한 분 더 필요합니다.',
    createdAt: '2024-07-09T10:35:00',
    isSent: false,
  },
  {
    id: 4,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '좋아요! 잘 부탁드립니다 🔥',
    createdAt: '2024-07-09T10:38:00',
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
    content: '안녕하세요! 2025 창업 아이디어 공모전 팀에서 팀원을 모집하고 있어요 :)',
    createdAt: minsAgo(28),
    isSent: false,
  },
  {
    id: 2,
    senderId: 3,
    senderName: '박팀장',
    senderAvatar: '🚀',
    content: '프로필을 보니 딱 맞을 것 같아서 연락드렸어요!',
    createdAt: minsAgo(27),
    isSent: false,
  },
  {
    id: 3,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '안녕하세요! 어떤 팀인지 조금 더 설명해 주실 수 있나요?',
    createdAt: minsAgo(20),
    isSent: true,
  },
  {
    id: 4,
    senderId: 3,
    senderName: '박팀장',
    senderAvatar: '🚀',
    content: '개발자, 기획자, 디자이너 총 5명으로 구성할 예정이에요. 현재 3명이 모였고 디자이너 한 분이 더 필요해요!',
    createdAt: minsAgo(15),
    isSent: false,
  },
  {
    id: 5,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '오, 좋은 팀이네요! 좀 더 자세히 얘기 나눠봐도 될까요?',
    createdAt: minsAgo(10),
    isSent: true,
  },
  {
    id: 6,
    senderId: 3,
    senderName: '박팀장',
    senderAvatar: '🚀',
    content: '물론이죠! 디자이너를 찾고 있는데요. 포트폴리오를 보내주실 수 있나요?',
    createdAt: minsAgo(3),
    isSent: false,
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
    senderId: 0,
    senderName: '',
    senderAvatar: '',
    content: 'AI 해커톤팀 채팅방 생성 됨',
    createdAt: '2024-07-10T09:10:00',
    isSent: false,
    isSystem: true,
  },
  {
    id: 2,
    senderId: 0,
    senderName: '',
    senderAvatar: '',
    content: '이팀장님이 입장했습니다',
    createdAt: '2024-07-10T09:12:00',
    isSent: false,
    isSystem: true,
  },
  {
    id: 3,
    senderId: 3,
    senderName: '이팀장',
    senderAvatar: '👑',
    content: '팀원 여러분 환영합니다! 모두 입장하면 카카오톡 채팅방 만들게요',
    createdAt: '2024-07-10T09:21:00',
    isSent: false,
  },
  {
    id: 4,
    senderId: 7,
    senderName: '최개발',
    senderAvatar: '👨‍💻',
    content: '안녕하세요! 잘 부탁드립니다.',
    createdAt: '2024-07-10T09:23:00',
    isSent: false,
  },
  {
    id: 5,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '반갑습니다. 열심히 참여하겠습니다.',
    createdAt: '2024-07-10T09:24:00',
    isSent: true,
  },
  {
    id: 6,
    senderId: 0,
    senderName: '',
    senderAvatar: '',
    content: '내가 입장했습니다',
    createdAt: '2024-07-10T09:25:00',
    isSent: false,
    isSystem: true,
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
    lastMessageAt: minsAgo(0),
    unreadCount: 5,
    participants: [dummyUser1, dummyUser6, dummyUser7, dummyUser8],
    detailType: 'group-status',
    matchStatus: 'none',
    teamInfo: {
      statusLabel: '팀원 1명 추가 입장 대기 중',
      title: '팀 현황',
      currentCount: 4,
      totalCount: 5,
      dDay: 14,
      // chat id=1: 내가(id=1) 모집자 → 모집자 입장 화면 테스트용
      members: [
        { id: 1, name: '나', role: '나', avatar: '👑', filled: true, isHost: true },
        { id: 6, name: '김기획', role: '기획', avatar: '👨‍💼', filled: true },
        { id: 7, name: '박디자인', role: '디자인', avatar: '👩‍🎨', filled: true },
        { id: 8, name: '이개발', role: '개발', avatar: '👨‍💻', filled: true },
      ],
    },
  },
  {
    id: 2,
    type: 'group',
    name: 'AI 해커톤 우리팀',
    avatar: '🚀',
    lastMessage: '반갑습니다. 열심히 참여하겠습니다.',
    lastMessageBy: '김지수',
    lastMessageAt: minsAgo(10),
    unreadCount: 2,
    participants: [dummyUser1, dummyUser7, dummyUser8],
    description: 'AI 해커톤 우리팀',
    detailType: 'group-status',
    matchStatus: 'none',
    teamInfo: {
      statusLabel: '팀원 2명 추가 입장 대기 중',
      title: '팀 현황',
      currentCount: 3,
      totalCount: 5,
      dDay: 10,
      // chat id=2: 이팀장(id=3)이 모집자 → 팀원 입장 화면 테스트용
      members: [
        { id: 3, name: '이팀장', role: '기획', avatar: '👑', filled: true, isHost: true },
        { id: 7, name: '최개발', role: '개발', avatar: '👨‍💻', filled: true },
        { id: 1, name: '나', role: '나', avatar: '👨‍💻', filled: true },
      ],
    },
  },

  // 1:1 매칭 채팅
  {
    id: 3,
    type: 'direct',
    name: '김모집',
    avatar: '👑',
    lastMessage: '좋아요! 잘 부탁드립니다 🔥',
    lastMessageBy: '김지수',
    lastMessageAt: minsAgo(1),
    unreadCount: 2,
    participants: [dummyUser1, dummyUser2],
    description: 'AI 해커톤 팀',
    detailType: 'member-invite',
    matchStatus: 'pending',
  },
  {
    id: 4,
    type: 'direct',
    name: '박팀장',
    avatar: '🚀',
    lastMessage: '디자이너를 찾고 있는데요. 포트폴리오 보내주실 수 있나요?',
    lastMessageBy: '박팀장',
    lastMessageAt: minsAgo(3),
    unreadCount: 1,
    participants: [dummyUser1, dummyUser3],
    description: '2025 창업 아이디어 팀',
    detailType: 'member-invite',
    matchStatus: 'pending',
  },
  {
    id: 5,
    type: 'direct',
    name: '이팀원',
    avatar: '⭐',
    lastMessage: '네, 함께 하고 싶으신가요?',
    lastMessageBy: '이팀원',
    lastMessageAt: hoursAgo(1),
    unreadCount: 0,
    participants: [dummyUser1, dummyUser4],
    detailType: 'leader-request',
    matchStatus: 'pending',
  },
  {
    id: 6,
    type: 'direct',
    name: '최기획자',
    avatar: '📋',
    lastMessage: '네, 언제 만날 수 있을까요?',
    lastMessageBy: '최기획자',
    lastMessageAt: daysAgo(1),
    unreadCount: 0,
    participants: [dummyUser1, dummyUser5],
    detailType: 'leader-request',
    matchStatus: 'pending',
  },
];
