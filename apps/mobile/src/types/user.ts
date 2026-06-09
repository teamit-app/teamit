export interface User {
  id: number;
  name: string;
  profileImage: string | null;
  region: string;
  education: string;
  skills: string[];
  introduction: string;
}

export interface MatchProfile {
  userId: number;
  contestId: number | null;
  projectName: string;
  teamSize: number;
  roles: string[];
  description: string;
}
