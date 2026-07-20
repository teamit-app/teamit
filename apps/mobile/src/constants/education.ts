import { EducationStatus } from '../types/mypage';

export const EDUCATION_STATUS_LABEL: Record<EducationStatus, string> = {
  ATTENDING: '재학',
  LEAVE: '휴학',
  COMPLETED: '수료/졸업유예',
  EXPECTED: '졸업예정',
  GRADUATED: '졸업',
};
