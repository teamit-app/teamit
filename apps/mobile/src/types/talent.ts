export type Gender = 'MALE' | 'FEMALE';

export interface TalentSkill {
  skillName: string;
  level: number;
}

export interface PoolUser {
  userId: number;
  nickname: string;
  gender: Gender;
  schoolName: string;
  major: string;
  verified: boolean;
  skills: TalentSkill[];
  certificates: string[];
  isMatchingActive: boolean;
  isHearted: boolean;
}

export interface TalentRecruitPost {
  postId: number;
  contestId: number;
  title: string;
  createdAt: string;
  views: number;
  chatCount: number;
  likeCount: number;
  skills: string[];
  experienceCondition: string;
  meetingType: string;
  location: string;
  intensity: string;
  currentMembers: number;
  totalMembers: number;
}

export interface TalentDetail extends PoolUser {
  location: string;
  temperature: number;
  // 어필글 (매칭 프로필에서)
  appealTitle: string;
  appealContent: string;
  // 참여 정보 (매칭 프로필에서)
  skillsDisplay: string[];
  contestExperienceDetail: string;
  intensityDetail: string;
  meetingPreference: string;
  teamVibeDetail: string;
  feedbackStyleDetail: string;
  leadershipDetail: string;
  // 경험
  contestHistory: Array<{ title: string; role: string; award?: string }>;
  certifications: Array<{ name: string; acquiredDate: string }>;
  // 리뷰
  reviewStats: {
    totalRating: string;
    responseSpeed: string;
    deadlineCompletion: string;
    participationIntensity: string;
  };
  reviewKeywords: Array<{ text: string; count: number }>;
  teamReviews: Array<{ content: string; reviewer: string }>;
  // 모집글 (없을 수 있음)
  recruitPosts?: TalentRecruitPost[];
}
