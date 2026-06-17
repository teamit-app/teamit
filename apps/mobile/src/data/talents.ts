import { PoolUser } from '../types/talent';

export const dummyTalents: PoolUser[] = [
  {
    userId: 1,
    nickname: '닉네임',
    gender: 'MALE',
    schoolName: '연세대학교',
    major: '컴퓨터공학',
    verified: true,
    skills: [
      { skillName: 'React', level: 3 },
      { skillName: 'TypeScript', level: 3 },
    ],
    certificates: ['컴퓨터활용능력1급', '정보처리기사', 'SQLD'],
    isMatchingActive: true,
    isHearted: true,
  },
  {
    userId: 2,
    nickname: '박민준',
    gender: 'MALE',
    schoolName: '연세대학교',
    major: '경영학',
    verified: true,
    skills: [
      { skillName: '기획', level: 3 },
      { skillName: 'PPT', level: 2 },
    ],
    certificates: ['컴퓨터활용능력1급'],
    isMatchingActive: true,
    isHearted: true,
  },
  {
    userId: 3,
    nickname: '이서연',
    gender: 'FEMALE',
    schoolName: '홍익대학교',
    major: '시각디자인학',
    verified: false,
    skills: [
      { skillName: 'Figma', level: 3 },
      { skillName: 'Illustrator', level: 2 },
    ],
    certificates: ['GTQ 1급'],
    isMatchingActive: true,
    isHearted: false,
  },
  {
    userId: 4,
    nickname: '김도윤',
    gender: 'MALE',
    schoolName: '고려대학교',
    major: '산업공학',
    verified: true,
    skills: [
      { skillName: 'Python', level: 3 },
      { skillName: '데이터분석', level: 2 },
    ],
    certificates: ['ADsP', 'SQLD'],
    isMatchingActive: false,
    isHearted: false,
  },
];
