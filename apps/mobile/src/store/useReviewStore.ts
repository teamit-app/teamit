import { create } from 'zustand';
import { getMySubmittedReviews } from '../services/reviewService';

interface ReviewState {
  // chatId별로 내가 이미 리뷰를 제출한 상대방 id 목록 (서버 기준)
  submittedReceiverIds: Record<number, number[]>;
  loadedChatIds: Set<number>;

  // 서버에서 로드 (이미 로드했으면 재호출 안 함)
  loadSubmitted: (chatId: number) => Promise<void>;

  // 제출 성공 직후 로컬에 낙관적으로 반영
  markSubmitted: (chatId: number, receiverId: number) => void;

  // chatId에서 내가 리뷰한 상대방 id 목록 조회
  getSubmittedReceiverIds: (chatId: number) => number[];
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  submittedReceiverIds: {},
  loadedChatIds: new Set(),

  loadSubmitted: async (chatId) => {
    if (get().loadedChatIds.has(chatId)) return;
    try {
      const receiverIds = await getMySubmittedReviews(chatId);
      set((s) => ({
        submittedReceiverIds: { ...s.submittedReceiverIds, [chatId]: receiverIds },
        loadedChatIds: new Set(s.loadedChatIds).add(chatId),
      }));
    } catch (e) {
      console.error('[ReviewStore] 제출한 리뷰 목록 로드 실패:', e);
    }
  },

  markSubmitted: (chatId, receiverId) =>
    set((s) => {
      const prev = s.submittedReceiverIds[chatId] ?? [];
      if (prev.includes(receiverId)) return s;
      return {
        submittedReceiverIds: { ...s.submittedReceiverIds, [chatId]: [...prev, receiverId] },
      };
    }),

  getSubmittedReceiverIds: (chatId) => get().submittedReceiverIds[chatId] ?? [],
}));
