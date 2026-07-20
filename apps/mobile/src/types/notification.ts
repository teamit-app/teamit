export type NotificationType =
  | 'MATCH_PROPOSAL'
  | 'PROPOSAL_RESPONSE'
  | 'DEADLINE'
  | 'MESSAGE'
  | 'MATCH_SUCCESS'
  | 'ANNOUNCEMENT';

export interface AppNotification {
  notificationId: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  referenceId: number;
  referenceType: string;
  createdAt: string;
  /** 화면 표시용 그룹 (오늘 / 어제) */
  group: '오늘' | '어제';
  /** 화면 표시용 상대 시간 문구 */
  relativeTime: string;
}
