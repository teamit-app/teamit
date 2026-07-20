import { UserRegion } from '../types/mypage';

export function formatRegionLabel(region: { sido: string; sigungu: string | null }): string {
  return region.sigungu ? `${region.sido} ${region.sigungu}` : `${region.sido} 전체`;
}

export function formatRegionsLabel(regions: UserRegion[], emptyLabel = '지역 선택'): string {
  if (regions.length === 0) return emptyLabel;
  const first = formatRegionLabel(regions[0]);
  if (regions.length === 1) return first;
  return `${first} 외 ${regions.length - 1}곳`;
}
