import { create } from 'zustand';

interface ReadState {
  readChats: Record<number, boolean>;
  readInvitations: Record<number, boolean>;
  markChatAsRead: (chatId: number) => void;
  markInvitationAsRead: (invitationId: number) => void;
}

// TODO: API 연동 필요 — POST /chat-rooms/{chatRoomId}/read (또는 백엔드 확정 엔드포인트)
// markChatAsRead / markInvitationAsRead 는 현재 세션 내 로컬 상태만 변경.
// 실서버 연동 시 이 store를 제거하고 [chatId].tsx에서 API를 직접 호출해야 함.
// (앱 재시작 시 서버의 unreadCount가 다시 반영되므로 로컬 override 불필요)
export const useReadStore = create<ReadState>((set) => ({
  readChats: {},
  readInvitations: {},
  markChatAsRead: (chatId) =>
    set((s) => ({ readChats: { ...s.readChats, [chatId]: true } })),
  markInvitationAsRead: (invitationId) =>
    set((s) => ({ readInvitations: { ...s.readInvitations, [invitationId]: true } })),
}));
