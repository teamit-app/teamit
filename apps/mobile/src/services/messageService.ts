import { apiRequest } from './api';
import { ChatRoom, Chat, Message } from '../types/message';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { dummyChatRooms } from '../data/chatRooms';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';

// ── 백엔드 응답 타입 ─────────────────────────────────────────────────────────

interface BackendGroupChat {
  chatRoomId: number;
  roomType: 'GROUP';
  teamName: string;
  memberCount: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface BackendDirectChat {
  chatRoomId: number;
  roomType: 'DIRECT';
  opponentNickname: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface BackendChatRoomListResponse {
  groupChats: BackendGroupChat[];
  directChats: BackendDirectChat[];
}

interface BackendChatMessage {
  messageId: number;
  senderId: number;
  senderNickname: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface BackendMessagePageResponse {
  content: BackendChatMessage[];
  totalElements: number;
  currentPage: number;
}

// ── 어댑터 ──────────────────────────────────────────────────────────────────

function adaptGroupChat(c: BackendGroupChat): ChatRoom {
  return {
    id: c.chatRoomId,
    type: 'group',
    name: c.teamName,
    avatar: '👥',
    lastMessage: c.lastMessage ?? '',
    lastMessageBy: '',
    lastMessageAt: c.lastMessageAt ?? '',
    unreadCount: c.unreadCount,
    participants: [],
    detailType: 'normal',
    matchStatus: 'none',
  };
}

function adaptDirectChat(c: BackendDirectChat): ChatRoom {
  return {
    id: c.chatRoomId,
    type: 'direct',
    name: c.opponentNickname,
    avatar: '👤',
    lastMessage: c.lastMessage ?? '',
    lastMessageBy: '',
    lastMessageAt: c.lastMessageAt ?? '',
    unreadCount: c.unreadCount,
    participants: [],
    detailType: 'normal',
    matchStatus: 'none',
  };
}

function adaptMessage(msg: BackendChatMessage, currentUserId: number): Message {
  return {
    id: msg.messageId,
    senderId: msg.senderId,
    senderName: msg.senderNickname,
    senderAvatar: '👤',
    content: msg.content,
    createdAt: msg.createdAt,
    isSent: msg.senderId === currentUserId,
  };
}

// ── API 함수 ─────────────────────────────────────────────────────────────────

export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const userId = useOnboardingStore.getState().userId;
  if (!userId) return [];

  const data = await apiRequest<BackendChatRoomListResponse>(`/users/${userId}/chat-rooms`);
  return [
    ...(data.groupChats ?? []).map(adaptGroupChat),
    ...(data.directChats ?? []).map(adaptDirectChat),
  ];
};

export const getChat = async (chatId: number): Promise<Chat | null> => {
  const userId = useOnboardingStore.getState().userId;
  if (!userId) return null;

  // 채팅방 메타데이터 (rooms 목록에서 찾기)
  const roomsData = await apiRequest<BackendChatRoomListResponse>(`/users/${userId}/chat-rooms`);
  const allRooms: ChatRoom[] = [
    ...(roomsData.groupChats ?? []).map(adaptGroupChat),
    ...(roomsData.directChats ?? []).map(adaptDirectChat),
  ];
  const room = allRooms.find((r) => r.id === chatId);
  if (!room) return null;

  // 메시지 조회
  const messagesData = await apiRequest<BackendMessagePageResponse>(
    `/chat-rooms/${chatId}/messages?userId=${userId}&page=0&size=50`,
  );
  const messages = (messagesData.content ?? []).map((m) => adaptMessage(m, userId));

  return {
    id: room.id,
    type: room.type,
    name: room.name,
    avatar: room.avatar,
    participants: room.participants,
    messages,
    description: room.description,
    detailType: room.detailType ?? 'normal',
    matchStatus: room.matchStatus ?? 'none',
    teamInfo: room.teamInfo,
  };
};

export const leaveChatRoom = async (chatId: number): Promise<void> => {
  const userId = useOnboardingStore.getState().userId;
  if (!userId) return;

  if (IS_MOCK) return;

  await apiRequest<null>(`/chat-rooms/${chatId}/members/${userId}`, { method: 'DELETE' });
};

// 제안하기: 상대방과의 1:1 채팅방 ID 반환 (없으면 생성)
export const getOrCreateDirectChatRoom = async (targetUserId: number): Promise<number> => {
  const userId = useOnboardingStore.getState().userId;
  if (!userId) throw new Error('로그인이 필요합니다');

  if (IS_MOCK) {
    // mock: 더미 1:1 채팅방 중 첫 번째 반환
    const directRoom = dummyChatRooms.find((r) => r.type === 'direct');
    return directRoom?.id ?? 3;
  }

  const response = await apiRequest<{ chatRoomId: number }>(
    `/users/${userId}/chat-rooms/direct?targetUserId=${targetUserId}`,
    { method: 'POST' },
  );
  return response.chatRoomId;
};

export const sendMessage = async (chatId: number, text: string): Promise<Message> => {
  const userId = useOnboardingStore.getState().userId ?? 1;

  // mock 모드: GET /messages와 URL이 동일해 라우터 구분 불가 → 로컬 구성
  if (IS_MOCK) {
    return {
      id: Date.now(),
      senderId: userId,
      senderName: '나',
      senderAvatar: '👤',
      content: text,
      createdAt: new Date().toISOString(),
      isSent: true,
    };
  }

  const response = await apiRequest<{ messageId: number; createdAt: string }>(
    `/chat-rooms/${chatId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ senderId: userId, content: text }),
    },
  );

  return {
    id: response.messageId,
    senderId: userId,
    senderName: '나',
    senderAvatar: '👤',
    content: text,
    createdAt: response.createdAt,
    isSent: true,
  };
};
