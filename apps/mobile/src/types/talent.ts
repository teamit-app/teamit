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
