export type ContestCategory =
  | 'IT'
  | 'STARTUP'
  | 'DESIGN'
  | 'SOCIAL'
  | 'ENGINEERING'
  | 'ARTS'
  | 'ETC'
  | 'MARKETING';

export type ContestStatus = 'ONGOING' | 'DEADLINE_SOON' | 'CLOSED';

export type SortOption = 'LATEST' | 'POPULAR' | 'DEADLINE';

export interface Contest {
  contestId: number;
  title: string;
  organizer: string;
  category: ContestCategory;
  categoryLabel: string;
  status: ContestStatus;
  endDate: string;
  dDay: number;
  isNew: boolean;
  isHearted: boolean;
  isRegisteredAsParticipant: boolean;
  imageUrl?: string;
}

export interface ContestDetail extends Contest {
  targetAudience: string;
  fields: string;
  prizeScale: string;
  registrationPeriod: string;
  registrationUrl: string;
  hasRegisteredForMatching: boolean;
  // 공모전 상세내용 본문(줄바꿈 포함) — 관리자가 등록/수정. imageUrl은 Contest에서 상속
  content?: string;
}

export interface TeamMember {
  memberId: number;
  name: string;
  isHost: boolean;
  isRecruiting: boolean;
}

export interface PostComment {
  commentId: number;
  authorName: string;
  content: string;
  createdAt: string;
  isAuthor: boolean;
  isReply?: boolean;
}

export interface RecruitPost {
  postId: number;
  contestId: number;
  title: string;
  createdAt: string;
  views: number;
  chatCount: number;
  likeCount: number;
  skills: string[];
  experienceCondition: string;
  purposeCondition?: string;
  meetingType: string;
  location: string;
  intensity: string;
  genderCondition?: string;
  genderConditionLabel?: string;
  schoolConditionLabel?: string;
  recruiterGender?: string;
  currentMembers: number;
  totalMembers: number;
  isHearted: boolean;
  ownerUserId?: number;
  status?: string;
}

export interface RecruitPostDetail extends RecruitPost {
  teamName: string;
  contestName: string;
  contestPeriod: string;
  content: string;
  members: TeamMember[];
  genderCondition: string;
  schoolCondition: string;
  recruiter: {
    name: string;
    skills: string[];
    experienceCount: string;
    intensity: string;
    meetingType: string;
    location: string;
    teamVibe: string;
    feedbackStyle: string;
    leadershipStyle: string;
  };
  comments: PostComment[];
}

export interface ParticipationCard {
  contestId: number;
  contestTitle: string;
  skills: string;
  contestExperience: string;
  purpose: string;
  intensity: string;
  meetingPreference: string;
  location: string;
  teamVibe: string;
  feedbackStyle: string;
  leadership: string;
  appealTitle: string;
  appealContent: string;
}
