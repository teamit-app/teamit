import { create } from 'zustand';

interface ReadState {
  readInvitations: Record<number, boolean>;
  markInvitationAsRead: (invitationId: number) => void;
}

// TODO: API 연동 필요 — 초대장 읽음 처리 백엔드 엔드포인트가 아직 없어 세션 내
// 로컬 상태로만 표시한다(채팅 읽음 처리는 실서버 API로 이전됨 — messageService.markChatRoomAsRead 참고).
export const useReadStore = create<ReadState>((set) => ({
  readInvitations: {},
  markInvitationAsRead: (invitationId) =>
    set((s) => ({ readInvitations: { ...s.readInvitations, [invitationId]: true } })),
}));
