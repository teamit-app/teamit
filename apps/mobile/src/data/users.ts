import { User } from '../types/user';

export const dummyUsers: User[] = [
  {
    id: 1,
    name: '김지수',
    profileImage: null,
    region: '서울',
    education: '서울대학교 컴퓨터공학과',
    skills: ['React Native', 'TypeScript', 'Figma'],
    introduction: '프론트엔드 개발자입니다. 공모전 경험 다수 있어요.',
  },
  {
    id: 2,
    name: '박민준',
    profileImage: null,
    region: '경기',
    education: '연세대학교 경영학과',
    skills: ['기획', 'PPT', '마케팅'],
    introduction: '스타트업 기획자. 아이디어 넘치는 팀원을 찾아요.',
  },
  {
    id: 3,
    name: '이서연',
    profileImage: null,
    region: '서울',
    education: '홍익대학교 시각디자인학과',
    skills: ['UI/UX', 'Figma', 'Illustrator'],
    introduction: '디자이너입니다. 사용자 중심 디자인을 좋아해요.',
  },
];
