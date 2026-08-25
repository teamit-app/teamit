import { ContestCategory } from '../types/contest';

// 관리자 등록 폼 / 탐색 분야별 필터 / 카드·상세 라벨이 각자 따로 정의돼 있으면
// 라벨이 어긋나기 쉬워서(예: STARTUP이 "창업·아이디어"/"창업·비즈니스"로 제각각이었음)
// 이 파일 하나로 통일한다.
export const CONTEST_CATEGORY_ORDER: ContestCategory[] = [
  'IT',
  'MARKETING',
  'STARTUP',
  'DESIGN',
  'SOCIAL',
  'ENGINEERING',
  'ARTS',
  'ETC',
];

export const CONTEST_CATEGORY_LABEL: Record<ContestCategory, string> = {
  IT: 'IT·개발·데이터',
  MARKETING: '마케팅',
  STARTUP: '기획·아이디어',
  DESIGN: '디자인',
  SOCIAL: '사회·환경',
  ENGINEERING: '공학·기술',
  ARTS: '예술·문화',
  ETC: '기타',
};
