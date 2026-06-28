import { create } from 'zustand';
import { Message } from '../types/message';

interface InvitationState {
  // chatId별 동적으로 추가된 초대 메시지 (초대 전송 시 즉시 추가)
  extraMessages: Record<number, Message[]>;

  addInvitationMessages: (chatId: number, messages: Message[]) => void;
  getExtraMessages: (chatId: number) => Message[];
}

export const useInvitationStore = create<InvitationState>((set, get) => ({
  extraMessages: {},

  addInvitationMessages: (chatId, messages) =>
    set((s) => ({
      extraMessages: {
        ...s.extraMessages,
        [chatId]: [...(s.extraMessages[chatId] ?? []), ...messages],
      },
    })),

  getExtraMessages: (chatId) => get().extraMessages[chatId] ?? [],
}));
