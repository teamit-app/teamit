import { apiRequest } from './api';
import { PoolUser } from '../types/talent';

export const getTalentPool = (): Promise<PoolUser[]> =>
  apiRequest<PoolUser[]>('/talent-pool');
