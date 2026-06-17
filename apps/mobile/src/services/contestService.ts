import { apiRequest } from './api';
import { Contest } from '../types/contest';

export const getContests = (): Promise<Contest[]> =>
  apiRequest<Contest[]>('/contests');

export const getPopularContests = (): Promise<Contest[]> =>
  apiRequest<Contest[]>('/contests/popular');

export const getContestById = (contestId: number): Promise<Contest> =>
  apiRequest<Contest>(`/contests/${contestId}`);
