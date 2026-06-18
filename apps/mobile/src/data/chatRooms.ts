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
  avatar: '👨‍💼',
};

const dummyUser3: User = {
  id: 3,
  name: '박강민',
  avatar: '👨‍🎓',
};

const dummyUser4: User = {
  id: 4,
  name: '박준서',
  avatar: '👨‍🔬',
};

const dummyUser5: User = {
  id: 5,
  name: '이서연',
  avatar: '👩‍🎨',
};

// 더미 메시지 (1:1 - 김모집과의 대화)
export const dummyDirectMessages1: Message[] = [
  {
    id: 1,
    senderId: 2,
    senderName: '김모집',
    senderAvatar: '👨‍💼',
    content: '좋은 아이디어네요. 자세한 내용 부탁드립니다.',
    createdAt: '2024-07-09T10:30:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '안녕하세요! 포트폴리오를 확인해주셔서 감사합니다.',
    createdAt: '2024-07-09T11:00:00',
    isSent: true,
  },
];

// 더미 메시지 (1:1 - 박강민과의 대화)
export const dummyDirectMessages2: Message[] = [
  {
    id: 1,
    senderId: 3,
    senderName: '박강민',
    senderAvatar: '👨‍🎓',
    content: '네, 좋습니다. 언제 만날 수 있을까요?',
    createdAt: '2024-07-09T14:15:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '내일 오후 2시는 어떨까요?',
    createdAt: '2024-07-09T14:45:00',
    isSent: true,
  },
];

// 더미 메시지 (1:1 - 박준서와의 대화)
export const dummyDirectMessages3: Message[] = [
  {
    id: 1,
    senderId: 4,
    senderName: '박준서',
    senderAvatar: '👨‍🔬',
    content: '프로젝트에 관심이 있으신가요?',
    createdAt: '2024-07-09T15:20:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '네, 관심이 있습니다!',
    createdAt: '2024-07-09T15:50:00',
    isSent: true,
  },
];

// 더미 메시지 (단체 - AI 해커톤 팀)
export const dummyGroupMessages: Message[] = [
  {
    id: 1,
    senderId: 5,
    senderName: '이서연',
    senderAvatar: '👩‍🎨',
    content: '디자인 작업 마무리됐어요',
    createdAt: '2024-07-10T09:00:00',
    isSent: false,
  },
  {
    id: 2,
    senderId: 2,
    senderName: '김모집',
    senderAvatar: '👨‍💼',
    content: '대단해요! 정말 멋진데요',
    createdAt: '2024-07-10T09:30:00',
    isSent: false,
  },
  {
    id: 3,
    senderId: 1,
    senderName: '김지수',
    senderAvatar: '👨‍💻',
    content: '내일 최종 점검 해볼까요?',
    createdAt: '2024-07-10T10:00:00',
    isSent: true,
  },
];

export const dummyChatRooms: ChatRoom[] = [
  {
    id: 1,
    type: 'direct',
    name: '김모집',
    avatar: '👨‍💼',
    lastMessage: '안녕하세요! 포트폴리오를 확인해주셔서 감사합니다.',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-09T11:00:00',
    unreadCount: 0,
    participants: [dummyUser1, dummyUser2],
  },
  {
    id: 2,
    type: 'group',
    name: 'AI 해커톤 팀',
    avatar: '👥',
    lastMessage: '내일 최종 점검 해볼까요?',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-10T10:00:00',
    unreadCount: 2,
    participants: [dummyUser1, dummyUser2, dummyUser3, dummyUser5],
    description: 'AI 해커톤 참가팀',
  },
  {
    id: 3,
    type: 'direct',
    name: '박강민',
    avatar: '👨‍🎓',
    lastMessage: '내일 오후 2시는 어떨까요?',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-09T14:45:00',
    unreadCount: 0,
    participants: [dummyUser1, dummyUser3],
  },
  {
    id: 4,
    type: 'direct',
    name: '박준서',
    avatar: '👨‍🔬',
    lastMessage: '네, 관심이 있습니다!',
    lastMessageBy: '김지수',
    lastMessageAt: '2024-07-09T15:50:00',
    unreadCount: 0,
    participants: [dummyUser1, dummyUser4],
  },
];
