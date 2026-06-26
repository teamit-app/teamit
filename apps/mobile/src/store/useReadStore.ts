import { create } from 'zustand';

interface ReadState {
  readChats: Record<number, boolean>;
  readInvitations: Record<number, boolean>;
  markChatAsRead: (chatId: number) => void;
  markInvitationAsRead: (invitationId: number) => void;
}

export const useReadStore = create<ReadState>((set) => ({
  readChats: {},
  readInvitations: {},
  markChatAsRead: (chatId) =>
    set((s) => ({ readChats: { ...s.readChats, [chatId]: true } })),
  markInvitationAsRead: (invitationId) =>
    set((s) => ({ readInvitations: { ...s.readInvitations, [invitationId]: true } })),
}));
