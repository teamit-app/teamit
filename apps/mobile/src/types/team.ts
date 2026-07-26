export interface ContestHistory {
  title: string;
  role: string;
  award?: string;
}

export interface Certification {
  name: string;
  acquiredDate: string;
}

export interface ReviewKeyword {
  text: string;
  count: number;
}

// 리뷰어 정보는 절대 포함하지 않는다(익명 정책)
export interface TeamReviewItem {
  content: string;
}

export interface Candidate {
  id: number;
  name: string;
  gender: string;
  school: string;
  location: string;
  intro: string;
  introContent: string;
  skills: string[];
  averageRating: number;
  // "매칭된 후보"에서만 값이 있다 — "전체 후보"는 null(조건 일치도 배지 미표시)
  matchScore: number | null;
  intensity: string;
  meetingType: string;
  teamVibe: string;
  feedbackStyle: string;
  leadershipStyle: string;
  contestCount: number;
  contestExperience: string;
  contestExperienceDetail: string;
  contestHistory: ContestHistory[];
  certifications: Certification[];
  isVerified: boolean;
  reviewStats: {
    totalRating: string;
    responseSpeed: string;
    deadlineCompletion: string;
    participationIntensity: string;
  };
  reviewKeywords: ReviewKeyword[];
  teamReviews: TeamReviewItem[];
  reviews: CandidateReview[];
}

export interface CandidateReview {
  reviewId: number;
  reviewer: string;
  rating: number;
  content: string;
  createdAt: string;
}
