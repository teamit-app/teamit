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

export interface TeamReviewItem {
  content: string;
  reviewer: string;
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
  temperature: number;
  matchScore: number;
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
