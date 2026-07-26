export type Gender = 'MALE' | 'FEMALE';
export type EducationStatus = 'ATTENDING' | 'LEAVE' | 'COMPLETED' | 'EXPECTED' | 'GRADUATED';
export type VerificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type AwardStatus = 'AWARDED' | 'NOT_AWARDED' | 'PARTICIPATED';
export type OnlineOfflinePref = 'ONLINE' | 'OFFLINE' | 'MIXED';
export type LeadershipPref = 'WANT' | 'IF_NEEDED' | 'DONT_WANT';

export interface UserRegion {
  sido: string;
  sigungu: string | null;
}

export interface UserEducation {
  educationId: number;
  schoolName: string;
  status: EducationStatus;
  major: string;
  subMajor: string | null;
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationDocType?: 'STUDENT_ID' | 'ENROLLMENT_CERT';
  verificationFileName?: string;
  verificationSubmittedAt?: string;
  verificationRejectReason?: string | null;
}

export interface UserSkillItem {
  userSkillId: number;
  skillName: string;
  level: number;
}

export interface TeamReview {
  reviewId: number;
  content: string;
  contestName: string;
  reviewerRole: string;
}

export interface ContestCareer {
  careerItemId: number;
  careerType: 'CONTEST';
  contestName: string;
  roles: string[];
  startDate: string;
  endDate: string;
  awardStatus: AwardStatus;
}

export interface CertificateCareer {
  careerItemId: number;
  careerType: 'CERTIFICATE';
  certName: string;
  issuingOrg: string;
  acquiredDate: string;
}

export type CareerItem = ContestCareer | CertificateCareer;

export interface MyProfile {
  userId: number;
  nickname: string;
  name: string;
  gender: Gender;
  birthDate: string;
  profileImageUrl: string | null;
  isMatchingActive: boolean;
  averageRating: number;
  regions: UserRegion[];
  education: UserEducation | null;
  skills: UserSkillItem[];
  careers: CareerItem[];
  reviews: TeamReview[];
}

export type ParticipationPurpose = 'EXPERIENCE' | 'AWARD';

export interface MatchingProfileData {
  skills: string[];
  experienceLevel: 0 | 1 | 2;
  intensityLevel: 1 | 2 | 3 | 4;
  onlineOfflinePref: OnlineOfflinePref;
  regions: UserRegion[];
  teamVibe: number;
  feedbackStyle: number;
  leadershipPref: LeadershipPref;
  participationPurpose: ParticipationPurpose;
  appealTitle: string;
  appealContent: string;
}

export interface NotificationSettings {
  matchProposal: boolean;
  proposalResponse: boolean;
  deadlineAlert: boolean;
  messageAlert: boolean;
  matchSuccess: boolean;
  announcement: boolean;
}

export interface ContestRegistration {
  registrationId: number;
  contestId: number;
  contestTitle: string;
  organizer: string;
  registeredAt: string;
  endDate: string;
  dDay: number;
  participantCard: ParticipantCardData;
}

export interface PostApplication {
  applicationId: number;
  postId: number;
  contestId: number;
  contestTitle: string;
  postTitle: string;
  authorNickname: string;
  appliedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface ParticipantCardData {
  skills: string[];
  experienceLevel: number | null;
  intensityLevel: number | null;
  onlineOfflinePref: string | null;
  region: string;
  teamVibe: number | null;
  feedbackStyle: number | null;
  leadershipPref: string | null;
  participationPurpose: string | null;
  appealTitle: string;
  appealContent: string;
}

export interface ReceivedApplicationPost {
  postId: number;
  contestId: number;
  contestTitle: string;
  postTitle: string;
  createdAt: string;
  applicantCount: number;
  talentPool: TalentPoolCandidate[];
}

export interface TalentPoolCandidate {
  userId: number;
  nickname: string;
  skills: string[];
  workStyle: string;
  intensity: string;
}

export interface PostApplicant {
  userId: number;
  nickname: string;
  averageRating: number;
  gender: Gender;
  school: string;
  isSchoolVerified: boolean;
  introText: string;
  skills: string[];
  meetingTypeLabel: string;
  regionLabel: string;
  experienceLabel: string;
  intensityLabel: string;
  leadershipLabel: string;
  appealTitle: string;
  appealContent: string;
  // "매칭된 후보" 조회에서만 내려온다 — "전체 후보"는 null(조건 일치도 배지 미표시)
  matchScore?: number | null;
}

export interface PostApplicantPage {
  content: PostApplicant[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface LikedPost {
  postId: number;
  contestId: number;
  contestTitle: string;
  postTitle: string;
  roles: string[];
  teamSize: number;
  deadline: string;
  dDay: number;
  isOpen: boolean;
}
