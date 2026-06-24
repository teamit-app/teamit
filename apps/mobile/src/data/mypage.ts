import {
  MyProfile,
  MatchingProfileData,
  NotificationSettings,
  ContestRegistration,
  PostApplication,
  ReceivedApplicationPost,
} from '../types/mypage';

const dummyParticipantCard = {
  skills: ['Figma', 'Photoshop'],
  experienceCount: '0회',
  intensity: '적당하게 (주 4~7시간)',
  onlineOffline: '혼합형',
  region: '서울 강남구',
  leadership: '필요하면 할 수 있어요',
  appealTitle: '금융권 데이터 분석가를 목표로 합니다.',
  appealContent:
    '저는 금융 도메인에 관심이 있고, 현재 금융권 데이터분석 직무 희망중입니다. 발표를 잘하고 좋아해서 발표는 부담없이 할 수 있습니다!',
};

export const dummyMyProfile: MyProfile = {
  userId: 1,
  nickname: '김티밋',
  name: '김민준',
  gender: 'MALE',
  birthDate: '2002-05-11',
  profileImageUrl: null,
  isMatchingActive: true,
  temperature: 32,
  maxTemperature: 40,
  regions: [{ sido: '서울', sigungu: '강남구' }],
  education: {
    educationId: 1,
    schoolName: '연세대학교',
    status: 'ATTENDING',
    major: '컴퓨터공학과',
    subMajor: null,
    verified: false,
    verificationStatus: 'NONE',
    verificationRejectReason: null,
  },
  skills: [
    { userSkillId: 1, skillName: 'Figma', level: 3 },
    { userSkillId: 2, skillName: 'Photoshop', level: 2 },
  ],
  careers: [
    {
      careerItemId: 1,
      careerType: 'CONTEST',
      contestName: '2024 대학생 창업 아이디어 공모전',
      roles: ['기획', 'PM'],
      startDate: '2024.09.01',
      endDate: '2024.11.30',
      awardStatus: 'AWARDED',
    },
    {
      careerItemId: 2,
      careerType: 'CERTIFICATE',
      certName: 'SQLD (SQL 개발자)',
      issuingOrg: '한국데이터산업진흥원',
      acquiredDate: '2026.03.22',
    },
  ],
  reviews: [
    {
      reviewId: 1,
      content: '소통이 빨라서 협업하기 편했어요.',
      contestName: '국립중앙도서관 데이터 활용 공모전',
      reviewerRole: '협업자',
    },
    {
      reviewId: 2,
      content: '책임감 있게 끝까지 함께해줬어요.',
      contestName: '2025 대학생 창업 아이디어 공모전',
      reviewerRole: '협업자',
    },
    {
      reviewId: 3,
      content: '아이디어가 넘쳐서 팀에 활력을 줬어요.',
      contestName: 'SW 해커톤 2025 봄',
      reviewerRole: '협업자',
    },
  ],
};

export const dummyMatchingProfile: MatchingProfileData = {
  skills: ['Figma', 'Photoshop'],
  experienceLevel: 0,
  intensityLevel: 2,
  onlineOfflinePref: 'MIXED',
  regions: [{ sido: '서울', sigungu: '강남구' }],
  teamVibe: 4,
  feedbackStyle: 2,
  leadershipPref: 'IF_NEEDED',
  appealTitle: '금융권 데이터 분석가를 목표로 합니다.',
  appealContent:
    '저는 금융 도메인에 관심이 있고, 현재 금융권 데이터분석 직무 희망중입니다. 발표를 잘하고 좋아해서 발표는 부담없이 할 수 있습니다!',
};

export const dummyContestRegistrations: ContestRegistration[] = [
  {
    registrationId: 1,
    contestId: 1,
    contestTitle: '2025 대학생 창업 아이디어 공모전',
    organizer: '창업진흥원',
    registeredAt: '2025.05.20',
    endDate: '2025-08-15',
    dDay: 94,
    participantCard: dummyParticipantCard,
  },
  {
    registrationId: 2,
    contestId: 2,
    contestTitle: '2025 대학생 창업 아이디어 공모전',
    organizer: '창업진흥원',
    registeredAt: '2025.05.20',
    endDate: '2025-04-30',
    dDay: -10,
    participantCard: dummyParticipantCard,
  },
  {
    registrationId: 3,
    contestId: 3,
    contestTitle: '2025 대학생 창업 아이디어 공모전',
    organizer: '창업진흥원',
    registeredAt: '2025.05.20',
    endDate: '2025-03-15',
    dDay: -70,
    participantCard: dummyParticipantCard,
  },
];

export const dummyPostApplications: PostApplication[] = [
  {
    applicationId: 1,
    postId: 1,
    contestId: 1,
    contestTitle: '2025 대학생 창업 아이디어 공모전',
    postTitle: '같이 창업 아이디어 낼 백엔드 구합니다',
    authorNickname: '홍길동',
    appliedAt: '2025.05.22',
    status: 'PENDING',
  },
  {
    applicationId: 2,
    postId: 2,
    contestId: 1,
    contestTitle: 'SW 해커톤 2025 봄',
    postTitle: 'React 프론트엔드 팀원 모집해요',
    authorNickname: '김지우',
    appliedAt: '2025.04.12',
    status: 'ACCEPTED',
  },
  {
    applicationId: 3,
    postId: 3,
    contestId: 2,
    contestTitle: 'AI 스타트업 팀 빌딩 세션',
    postTitle: 'PM/기획자 포지션 팀원 구합니다',
    authorNickname: '이수민',
    appliedAt: '2025.03.08',
    status: 'REJECTED',
  },
];

export const dummyReceivedApplicationPosts: ReceivedApplicationPost[] = [
  {
    postId: 1,
    contestId: 1,
    contestTitle: '2025 대학생 창업 아이디어 공모전',
    postTitle: '창업 아이디어 낼 프론트엔드 팀원 구합니다',
    createdAt: '2025.05.15',
    applicantCount: 3,
    talentPool: [
      {
        userId: 2,
        nickname: '김민준',
        skills: ['React Native', 'Figma'],
        workStyle: '혼합형',
        intensity: '주 4~7h',
      },
      {
        userId: 3,
        nickname: '이서연',
        skills: ['Figma', 'Illustrator'],
        workStyle: '온라인',
        intensity: '주 1~3h',
      },
      {
        userId: 4,
        nickname: '최예린',
        skills: ['Java', 'Notion'],
        workStyle: '오프라인',
        intensity: '주 8h',
      },
    ],
  },
  {
    postId: 2,
    contestId: 2,
    contestTitle: '2026 고용노동부 공공데이터 활용 공모전',
    postTitle: '2026 고용노동부 공공데이터 활용 공모전 참여자 모집',
    createdAt: '2025.05.15',
    applicantCount: 0,
    talentPool: [
      {
        userId: 2,
        nickname: '김민준',
        skills: ['React Native', 'Figma'],
        workStyle: '혼합형',
        intensity: '주 4~7h',
      },
      {
        userId: 3,
        nickname: '이서연',
        skills: ['Figma', 'Illustrator'],
        workStyle: '온라인',
        intensity: '주 1~3h',
      },
      {
        userId: 4,
        nickname: '최예린',
        skills: ['Java', 'Notion'],
        workStyle: '오프라인',
        intensity: '주 8h',
      },
    ],
  },
];

export const dummyNotificationSettings: NotificationSettings = {
  matchProposal: true,
  proposalResponse: true,
  deadlineAlert: true,
  messageAlert: true,
  matchSuccess: true,
  announcement: true,
};
