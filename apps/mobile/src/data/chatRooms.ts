import { ChatRoom } from '../types/message';

export const dummyChatRooms: ChatRoom[] = [
  {
    id: 1,
    type: 'group',
    name: '2024 창업경진대회 팀',
    lastMessage: '내일 오후 2시에 회의 어때요?',
    lastMessageAt: '2024-07-10T14:30:00',
    unreadCount: 3,
    participants: [1, 2, 3],
  },
  {
    id: 2,
    type: 'direct',
    name: '박민준',
    lastMessage: '포트폴리오 확인했어요!',
    lastMessageAt: '2024-07-09T18:00:00',
    unreadCount: 0,
    participants: [1, 2],
  },
];
