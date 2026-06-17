import { apiRequest } from './api';
import { AppNotification } from '../types/notification';

export const getNotifications = (): Promise<AppNotification[]> =>
  apiRequest<AppNotification[]>('/notifications');
