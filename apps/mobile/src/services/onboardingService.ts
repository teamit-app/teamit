import { apiRequest } from './api';

export interface BasicInfoRequest {
  nickname: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string; // 'YYYY-MM-DD'
}

export interface EducationRequest {
  schoolName: string;
  status: 'ATTENDING' | 'LEAVE' | 'COMPLETED' | 'EXPECTED' | 'GRADUATED';
  majorType: 'SINGLE' | 'DOUBLE';
  major: string;
  subMajor: string | null;
}

interface BasicInfoResponseData {
  userId: number;
  nickname: string;
  name: string;
  gender: string;
  birthDate: string;
}

interface EducationResponseData {
  educationId: number;
  schoolName: string;
  status: string;
  major: string;
  verified: boolean;
}

// POST /users/onboarding/basic
export const submitBasicInfo = async (data: BasicInfoRequest): Promise<number> => {
  const result = await apiRequest<BasicInfoResponseData>('/users/onboarding/basic', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.userId;
};

// POST /users/educations
export const submitEducation = async (_userId: number, data: EducationRequest): Promise<number> => {
  const result = await apiRequest<EducationResponseData>(`/users/educations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.educationId;
};
