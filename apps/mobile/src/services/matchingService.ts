import { apiRequest } from './api';
import { MatchingStatus } from '../types/matching';

export const getMatchingStatus = (): Promise<MatchingStatus> =>
  apiRequest<MatchingStatus>('/matching/status');
