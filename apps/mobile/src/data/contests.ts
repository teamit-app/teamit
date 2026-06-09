import { Contest } from '../types/contest';

export const dummyContests: Contest[] = [
  {
    id: 1,
    title: '2024 대한민국 창업경진대회',
    organizer: '중소벤처기업부',
    deadline: '2024-08-31',
    categories: ['창업', 'IT'],
    thumbnail: null,
    description: '혁신적인 스타트업 아이디어를 겨루는 경진대회입니다.',
  },
  {
    id: 2,
    title: 'K-디지털 해커톤',
    organizer: '과학기술정보통신부',
    deadline: '2024-09-15',
    categories: ['IT', '개발'],
    thumbnail: null,
    description: 'AI·데이터 활용 서비스 개발 해커톤입니다.',
  },
  {
    id: 3,
    title: '청년 사회혁신 아이디어 공모전',
    organizer: '행정안전부',
    deadline: '2024-10-01',
    categories: ['사회혁신', '기획'],
    thumbnail: null,
    description: '사회 문제를 해결하는 혁신적 아이디어를 모집합니다.',
  },
];
