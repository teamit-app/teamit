export type ContestCategory =
  | 'IT'
  | 'STARTUP'
  | 'DESIGN'
  | 'SOCIAL'
  | 'ENGINEERING'
  | 'ARTS'
  | 'ETC';

export type ContestStatus = 'ONGOING' | 'DEADLINE_SOON' | 'CLOSED';

export interface Contest {
  contestId: number;
  title: string;
  organizer: string;
  category: ContestCategory;
  categoryLabel: string;
  status: ContestStatus;
  endDate: string;
  dDay: number;
  isNew: boolean;
  isHearted: boolean;
}
