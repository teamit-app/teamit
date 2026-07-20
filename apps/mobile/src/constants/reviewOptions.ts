// ── 팀원 리뷰 단계별 옵션 데이터 ──────────────────────────────────────────────
// review-write.tsx(리뷰 작성)와 프로필 통계(받은 리뷰 평균)에서 공통으로 사용

export const TOTAL_RATING_OPTIONS = [
  { value: 5, label: '★★★★★', desc: '다음에도 꼭 함께하고 싶어요' },
  { value: 4, label: '★★★★☆', desc: '좋은 팀원이었어요' },
  { value: 3, label: '★★★☆☆', desc: '보통이었어요. 무난하게 함께할 수 있었어요' },
  { value: 2, label: '★★☆☆☆', desc: '아쉬운 점이 많았어요' },
  { value: 1, label: '★☆☆☆☆', desc: '다음에는 함께하기 어려울 것 같아요' },
];

// score: 값이 클수록 좋음(총평 별점과 동일한 방향) — 평균 계산, 프로필 통계 매칭, 별점 환산에 공통 사용
export const RESPONSE_SPEED_OPTIONS = [
  { value: '1시간 이내',  score: 5, desc: '매우 빠름 · 거의 항상 즉각 답했어요' },
  { value: '반나절 이내', score: 4, desc: '빠름 · 몇 시간 내로 답했어요' },
  { value: '하루 이내',   score: 3, desc: '보통 · 하루 안에 답했어요' },
  { value: '이틀 이상',   score: 2, desc: '느림 · 답장에 하루 넘게 걸렸어요' },
  { value: '잠수',        score: 1, desc: '프로젝트 도중에 연락이 끊겼어요' },
];

export const DEADLINE_OPTIONS = [
  { value: '항상 제때',   score: 5, desc: '마감을 단 한번도 어기지 않았어요' },
  { value: '대부분 제때', score: 4, desc: '대부분 기한 내에 완료했어요 (1회 지연)' },
  { value: '가끔 늦음',   score: 3, desc: '몇 번(2~3회) 늦은 적이 있었어요' },
  { value: '자주 늦음',   score: 2, desc: '자주(4회 이상) 마감을 지키지 못했어요' },
  { value: '항상 늦음',   score: 1, desc: '한번도 마감을 지키지 않았어요' },
];

// 다른 세 항목과 동일하게 5단계로 맞춰서 평균 낼 때 최고점(5.0)이 나올 수 있도록 함
export const INTENSITY_OPTIONS = [
  { value: '매우 적극적 참여', score: 5, desc: '기대보다 훨씬 열정적으로 참여했어요' },
  { value: '적극적 참여',     score: 4, desc: '적극적으로 역할 이상을 해냈어요' },
  { value: '보통 참여',       score: 3, desc: '맡은 역할을 성실하게 다해줬어요' },
  { value: '소극적 참여',     score: 2, desc: '참여도가 조금 아쉬웠어요' },
  { value: '참여하지 않음',   score: 1, desc: '전혀 참여하지 않았어요' },
];
