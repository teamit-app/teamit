// 공모전 마감일이 지나도(dDay가 음수) "D--N"처럼 깨져 보이지 않도록
// D-Day를 표시하는 모든 곳에서 공용으로 쓰는 포맷터.
export function formatDDay(dDay: number): string {
  if (dDay > 0) return `D-${dDay}`;
  if (dDay === 0) return 'D-day';
  return `D+${Math.abs(dDay)}`;
}
