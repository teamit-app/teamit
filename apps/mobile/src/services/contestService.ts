import { Contest } from '../types/contest';
import { dummyContests } from '../data/contests';

// TODO: 백엔드 API 연결 시 fetch 호출로 교체
export const getContests = async (): Promise<Contest[]> => {
  return dummyContests;
};

export const getContestById = async (id: number): Promise<Contest | undefined> => {
  return dummyContests.find((c) => c.id === id);
};
