import { apiRequest } from './api';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';

// ── 요청/응답 타입 ─────────────────────────────────────────────────────────────

export interface SubmitReviewRequest {
  receiverId: number;
  totalRating: number;
  responseSpeed: string;
  deadlineCompletion: string;
  participationIntensity: string;
  keywords: string[];
  comment?: string;
}

export interface ReceivedReview {
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar?: string; // 백엔드 미지원 시 UI에서 '👤' 기본값 사용
  totalRating: number;
  responseSpeed: string;
  deadlineCompletion: string;
  participationIntensity: string;
  keywords: string[];
  comment?: string;
}

// ── mock 수신 리뷰 (현재 my-reviews.tsx의 DUMMY_RECEIVED 기반) ─────────────────

const MOCK_RECEIVED_REVIEWS: ReceivedReview[] = [
  {
    reviewerId: 9,
    reviewerName: '이유진',
    reviewerAvatar: '👩‍💻',
    totalRating: 5,
    responseSpeed: '1시간 이내',
    deadlineCompletion: '항상 제때',
    participationIntensity: '적극적 참여',
    keywords: ['리더십이 있어요', '아이디어가 넘쳐요', '분위기 메이커예요', '책임감 있어요'],
    comment: '팀장님 덕분에 좋은 팀 분위기에서 공모전을 마칠 수 있었어요. 다음에도 꼭 함께하고 싶습니다!',
  },
  {
    reviewerId: 10,
    reviewerName: '박준혁',
    reviewerAvatar: '🎯',
    totalRating: 4,
    responseSpeed: '1시간 이내',
    deadlineCompletion: '항상 제때',
    participationIntensity: '소극적 참여',
    keywords: ['책임감 있어요', '꼼꼼하게 작업해요'],
    comment: '꼼꼼하게 프로젝트를 이끌어줘서 좋았어요.',
  },
];

// ── API 함수 ──────────────────────────────────────────────────────────────────

/**
 * 팀원 리뷰 제출
 * POST /chat-rooms/{chatRoomId}/reviews
 */
export const postReview = async (
  chatRoomId: number,
  request: SubmitReviewRequest,
): Promise<{ reviewId: number }> => {
  if (IS_MOCK) {
    return { reviewId: Date.now() };
  }
  return apiRequest<{ reviewId: number }>(`/chat-rooms/${chatRoomId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

/**
 * 내가 받은 리뷰 목록 조회
 * GET /chat-rooms/{chatRoomId}/reviews/received
 */
export const getReceivedReviews = async (chatRoomId: number): Promise<ReceivedReview[]> => {
  if (IS_MOCK) {
    return MOCK_RECEIVED_REVIEWS;
  }
  const data = await apiRequest<{ reviews: ReceivedReview[] }>(
    `/chat-rooms/${chatRoomId}/reviews/received`,
  );
  return data.reviews ?? [];
};
