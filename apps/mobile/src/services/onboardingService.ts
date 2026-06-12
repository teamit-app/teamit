// TODO: 백엔드 연결 시 실제 fetch 호출로 교체
// Base URL: https://api.teamit.app/api/v1

export interface BasicInfoRequest {
  nickname: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string; // 'YYYY-MM-DD'
}

export interface RegionItem {
  sido: string;
  sigungu: string | null;
}

export interface EducationRequest {
  schoolName: string;
  status: 'ATTENDING' | 'COMPLETED' | 'EXPECTED' | 'GRADUATED';
  majorType: 'SINGLE' | 'DOUBLE';
  major: string;
  subMajor: string | null;
}

export const submitBasicInfo = async (data: BasicInfoRequest): Promise<number> => {
  // POST /users/onboarding/basic → returns userId
  return 1; // dummy userId
};

export const submitRegions = async (userId: number, regions: RegionItem[]): Promise<void> => {
  // POST /users/{userId}/regions
};

export const submitEducation = async (userId: number, data: EducationRequest): Promise<number> => {
  // POST /users/{userId}/educations → returns educationId
  return 1; // dummy educationId
};
