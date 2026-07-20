import { Platform, useWindowDimensions } from 'react-native';

// 네이티브 앱에서는 항상 false — 기존 모바일 동작에 전혀 영향 없음.
// 웹에서 뷰포트가 모바일 폭보다 넓을 때만 true (PC 브라우저 중앙 정렬 프레임용).
export function useIsWideScreen(breakpoint = 560) {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= breakpoint;
}
