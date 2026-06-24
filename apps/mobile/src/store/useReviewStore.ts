import { create } from 'zustand';

export interface ReviewDraft {
  memberId: number;
  memberName: string;
  totalRating: number;       // 1~5 (별점)
  responseSpeed: string;
  deadlineCompletion: string;
  participationIntensity: string;
  keywords: string[];
  comment: string;
}

interface ReviewState {
  // chatId별로 제출 완료된 리뷰 목록
  submittedReviews: Record<number, ReviewDraft[]>;

  // 현재 작성 중인 리뷰 초안
  draft: Partial<ReviewDraft>;

  // 초안 필드 업데이트
  setDraftField: <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) => void;
  resetDraft: () => void;

  // 리뷰 제출
  submitReview: (chatId: number, review: ReviewDraft) => void;

  // chatId의 제출된 리뷰 조회
  getSubmittedReviews: (chatId: number) => ReviewDraft[];
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  submittedReviews: {},
  draft: {},

  setDraftField: (key, value) =>
    set((s) => ({ draft: { ...s.draft, [key]: value } })),

  resetDraft: () => set({ draft: {} }),

  submitReview: (chatId, review) =>
    set((s) => ({
      submittedReviews: {
        ...s.submittedReviews,
        [chatId]: [...(s.submittedReviews[chatId] ?? []), review],
      },
    })),

  getSubmittedReviews: (chatId) => get().submittedReviews[chatId] ?? [],
}));
