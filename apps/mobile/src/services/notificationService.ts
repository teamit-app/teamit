import { apiRequest } from './api';
import { AppNotification } from '../types/notification';

interface BackendNotification {
  notificationId: number;
  type: AppNotification['type'];
  title: string;
  body: string;
  isRead: boolean;
  referenceId: number;
  referenceType: string;
  createdAt: string; // ISO 8601
}

interface NotificationsPageResponse {
  content: BackendNotification[];
  unreadCount: number;
}

function adaptNotification(n: BackendNotification): AppNotification {
  const created = new Date(n.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  const isToday =
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    created.getFullYear() === yesterday.getFullYear() &&
    created.getMonth() === yesterday.getMonth() &&
    created.getDate() === yesterday.getDate();

  let relativeTime: string;
  if (diffMin < 1) relativeTime = '방금 전';
  else if (diffMin < 60) relativeTime = `${diffMin}분 전`;
  else if (diffMin < 1440) relativeTime = `${Math.floor(diffMin / 60)}시간 전`;
  else relativeTime = `${Math.floor(diffMin / 1440)}일 전`;

  return {
    ...n,
    group: isToday ? '오늘' : isYesterday ? '어제' : '오늘',
    relativeTime,
  };
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  try {
    const data = await apiRequest<NotificationsPageResponse>(
      '/users/notifications?page=0&size=50',
    );
    return data.content.map(adaptNotification);
  } catch {
    // 알림 API 미구현 시 빈 목록 반환
    return [];
  }
};
