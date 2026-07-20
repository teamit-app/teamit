import { apiRequest } from './api';
import { ChatRoom, Chat, Message, InvitationCardData } from '../types/message';
import { useAuthStore } from '../store/useAuthStore';
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
  // teamInfo 필드 (서버에서 채워주는 값)
  postId?: number;
  postTitle?: string;
  contestId?: number;
  contestTitle?: string;
  dDay?: number;
  isExpired?: boolean;
  teamConfirmed?: boolean;
  currentCount?: number;
  totalCount?: number;
  members?: Array<{ id: number | null; name: string; realName?: string | null; isHost: boolean; filled: boolean }>;
  statusLabel?: string;
}

interface BackendDirectChat {
  chatRoomId: number;
  roomType: 'DIRECT';
  opponentUserId?: number | null;
  opponentNickname: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface BackendChatRoomListResponse {
  groupChats: BackendGroupChat[];
  directChats: BackendDirectChat[];
}

export interface BackendChatMessage {
  messageId: number;
  senderId: number;
  senderNickname: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  isSystem?: boolean;
  invitationCard?: InvitationCardData;
}

interface BackendMessagePageResponse {
  content: BackendChatMessage[];
  totalElements: number;
  currentPage: number;
}

// ── 어댑터 ──────────────────────────────────────────────────────────────────

function adaptGroupChat(c: BackendGroupChat): ChatRoom {
  const teamInfo =
    c.currentCount !== undefined && c.totalCount !== undefined && c.members !== undefined
      ? {
          statusLabel: c.statusLabel ?? '',
          title: '팀 현황',
          currentCount: c.currentCount,
          totalCount: c.totalCount,
          dDay: c.dDay,
          isExpired: c.isExpired ?? false,
          teamConfirmed: c.teamConfirmed ?? false,
          postTitle: c.postTitle,
          contestId: c.contestId,
          contestTitle: c.contestTitle,
          members: c.members.map((m) => ({
            id: m.id ?? 0,
            name: m.name,
            realName: m.realName ?? undefined,
            role: '',
            avatar: '👤',
            filled: m.filled,
            isHost: m.isHost,
          })),
        }
      : undefined;

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
    detailType: teamInfo ? 'group-status' : 'normal',
    matchStatus: 'none',
    postId: c.postId,
    teamInfo,
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
    opponentUserId: c.opponentUserId ?? undefined,
  };
}

export function adaptMessage(msg: BackendChatMessage, currentUserId: number): Message {
  return {
    id: msg.messageId,
    senderId: msg.senderId,
    senderName: msg.senderNickname,
    senderAvatar: '👤',
    content: msg.content,
    createdAt: msg.createdAt,
    isSent: msg.senderId === currentUserId,
    isSystem: msg.isSystem ?? false,
    invitationCard: msg.invitationCard,
  };
}

// ── 동적 생성 1:1 채팅방 (초대 전송 시 mock 모드에서 로컬 저장) ─────────────────
const createdDirectRooms: ChatRoom[] = [];

export const registerCreatedRoom = (room: ChatRoom): void => {
  if (!createdDirectRooms.find((r) => r.id === room.id)) {
    createdDirectRooms.push(room);
  }
};

// ── API 함수 ─────────────────────────────────────────────────────────────────

export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const data = await apiRequest<BackendChatRoomListResponse>('/users/chat-rooms');
  const apiRooms = [
    ...(data.groupChats ?? []).map(adaptGroupChat),
    ...(data.directChats ?? []).map(adaptDirectChat),
  ];
  if (IS_MOCK && createdDirectRooms.length > 0) {
    const existingIds = new Set(apiRooms.map((r) => r.id));
    return [...apiRooms, ...createdDirectRooms.filter((r) => !existingIds.has(r.id))];
  }
  return apiRooms;
};

export const getChat = async (chatId: number): Promise<Chat | null> => {
  const userId = useAuthStore.getState().currentUserId ?? 0;

  // 채팅방 메타데이터 (rooms 목록에서 찾기)
  const roomsData = await apiRequest<BackendChatRoomListResponse>('/users/chat-rooms');
  const allRooms: ChatRoom[] = [
    ...(roomsData.groupChats ?? []).map(adaptGroupChat),
    ...(roomsData.directChats ?? []).map(adaptDirectChat),
    ...(IS_MOCK ? createdDirectRooms : []),
  ];
  const room = allRooms.find((r) => r.id === chatId);
  if (!room) return null;

  // 메시지 조회 — 실서버는 최신순(DESC)으로 내려주므로(페이지네이션 편의) 화면엔 오래된 순으로 뒤집어서 표시
  // (mock 라우터는 더미 데이터를 이미 오래된 순 그대로 반환하므로 뒤집지 않음)
  const messagesData = await apiRequest<BackendMessagePageResponse>(
    `/chat-rooms/${chatId}/messages?page=0&size=50`,
  );
  const orderedContent = IS_MOCK
    ? (messagesData.content ?? [])
    : (messagesData.content ?? []).slice().reverse();
  const messages = orderedContent.map((m) => adaptMessage(m, userId));

  // mock 모드: 백엔드가 제공하지 않는 UI 전용 필드(detailType/matchStatus/teamInfo)를
  // 더미 데이터에서 보완 (실서버 모드에서는 사용 안 함)
  const dummyRoom = IS_MOCK ? dummyChatRooms.find((r) => r.id === chatId) : null;

  return {
    id: room.id,
    type: room.type,
    name: room.name,
    avatar: room.avatar,
    participants: dummyRoom?.participants ?? room.participants,
    messages,
    description: dummyRoom?.description ?? room.description,
    detailType: dummyRoom?.detailType ?? room.detailType ?? 'normal',
    matchStatus: dummyRoom?.matchStatus ?? room.matchStatus ?? 'none',
    teamInfo: dummyRoom?.teamInfo ?? room.teamInfo,
    postId: room.postId,
  };
};

export const leaveChatRoom = async (chatId: number): Promise<void> => {
  if (IS_MOCK) return;

  await apiRequest<null>(`/chat-rooms/${chatId}/leave`, { method: 'DELETE' });
};

// 채팅방 삭제(방장 전용) — 연결된 모집글도 함께 삭제되고 지원자·팀원에게 알림이 감
export const deleteChatRoom = async (chatId: number): Promise<void> => {
  if (IS_MOCK) return;

  await apiRequest<null>(`/chat-rooms/${chatId}`, { method: 'DELETE' });
};

// mock: userId → 직접 채팅방 id 매핑 (후보 id 기준)
const MOCK_DIRECT_CHAT_MAP: Record<number, number> = { 1: 5, 2: 6, 3: 3, 4: 4 };

// 제안하기: 상대방과의 1:1 채팅방 ID 반환 (없으면 생성)
export const getOrCreateDirectChatRoom = async (targetUserId: number): Promise<number> => {
  if (IS_MOCK) {
    return MOCK_DIRECT_CHAT_MAP[targetUserId]
      ?? dummyChatRooms.find((r) => r.type === 'direct')?.id
      ?? 3;
  }

  const response = await apiRequest<{ chatRoomId: number }>(
    `/users/chat-rooms/direct?targetUserId=${targetUserId}`,
    { method: 'POST' },
  );
  return response.chatRoomId;
};

export const sendMessage = async (chatId: number, text: string): Promise<Message> => {
  const userId = useAuthStore.getState().currentUserId ?? 1;

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
      body: JSON.stringify({ content: text }),
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

// 채팅방을 열었을 때(또는 열어둔 채로 새 메시지를 받았을 때) 호출 — 서버의
// lastReadMessageId를 이 채팅방의 최신 메시지까지로 갱신해 안읽음 배지를 정확히 반영한다.
// 이전엔 이 API 자체가 없어서 useReadStore(세션 로컬 상태)로만 흉내내다보니
// 재로그인하면 다시 안읽음으로 보이는 문제가 있었다.
export const markChatRoomAsRead = async (chatId: number): Promise<void> => {
  if (IS_MOCK) return;
  await apiRequest<null>(`/chat-rooms/${chatId}/read`, { method: 'PATCH' });
};
