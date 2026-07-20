import {
  TOTAL_RATING_OPTIONS,
  RESPONSE_SPEED_OPTIONS,
  DEADLINE_OPTIONS,
  INTENSITY_OPTIONS,
} from '../constants/reviewOptions';

export interface ReviewStatRow {
  label: string;
  value: string;
}

export interface ReviewKeywordChip {
  text: string;
  count: number;
}

// 리뷰어 정보는 절대 포함하지 않는다(익명 정책)
export interface ReviewCommentItem {
  content: string;
  rating: number;
}

// 통계 계산에 필요한 최소 필드만 요구 — ReceivedReview(채팅방 단위)와
// AnonymousReview(집계, 리뷰어 정보 없음) 둘 다 이 형태를 만족한다
export interface ReviewLike {
  totalRating: number;
  responseSpeed: string;
  deadlineCompletion: string;
  participationIntensity: string;
  keywords: string[];
}

function computeAvg(reviews: ReviewLike[], picker: (r: ReviewLike) => number): number {
  return reviews.reduce((sum, r) => sum + picker(r), 0) / reviews.length;
}

function clampRound(avg: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(avg)));
}

function scoreOf(options: { value: string; score: number }[], v: string): number {
  return options.find((o) => o.value === v)?.score ?? 0;
}

// 받은 리뷰 전체(여러 건)의 항목별 평균 + 그 평균에 가장 가까운 텍스트 지표
// "총평"은 리뷰 작성 1단계에서 직접 받는 전체 평점(totalRating)의 평균이다.
export function buildReviewStats(reviews: ReviewLike[]): ReviewStatRow[] {
  if (reviews.length === 0) return [];

  const totalAvg       = computeAvg(reviews, (r) => r.totalRating);
  const speedAvg       = computeAvg(reviews, (r) => scoreOf(RESPONSE_SPEED_OPTIONS, r.responseSpeed));
  const deadlineAvg    = computeAvg(reviews, (r) => scoreOf(DEADLINE_OPTIONS, r.deadlineCompletion));
  const intensityAvg   = computeAvg(reviews, (r) => scoreOf(INTENSITY_OPTIONS, r.participationIntensity));

  const totalLabel     = TOTAL_RATING_OPTIONS.find((o) => o.value === clampRound(totalAvg, 1, 5))?.label ?? '-';
  const speedLabel     = RESPONSE_SPEED_OPTIONS.find((o) => o.score === clampRound(speedAvg, 1, 5))?.value ?? '-';
  const deadlineLabel  = DEADLINE_OPTIONS.find((o) => o.score === clampRound(deadlineAvg, 1, 5))?.value ?? '-';
  const intensityLabel = INTENSITY_OPTIONS.find((o) => o.score === clampRound(intensityAvg, 1, 5))?.value ?? '-';

  return [
    { label: '총평',      value: `${totalLabel} (${totalAvg.toFixed(2)}점)` },
    { label: '응답 속도', value: `${speedLabel} (${speedAvg.toFixed(2)}점)` },
    { label: '마감 완수', value: `${deadlineLabel} (${deadlineAvg.toFixed(2)}점)` },
    { label: '참여 강도', value: `${intensityLabel} (${intensityAvg.toFixed(2)}점)` },
  ];
}

export function buildReviewKeywords(reviews: ReviewLike[]): ReviewKeywordChip[] {
  const map: Record<string, number> = {};
  reviews.forEach((r) => r.keywords.forEach((k) => { map[k] = (map[k] ?? 0) + 1; }));
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([text, count]) => ({ text, count }));
}

// 리뷰 1건(한 팀원이 준 리뷰)의 별점 = 리뷰 작성 1단계에서 직접 받은 전체 평점(totalRating)
export function reviewerStarRating(review: ReviewLike): number {
  return review.totalRating;
}
