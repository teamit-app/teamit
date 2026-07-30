import { useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { trackEvent } from '../services/gtm';

const THRESHOLDS = [25, 50, 75, 90] as const;

// GA4 향상된 측정의 스크롤 이벤트는 document/body 스크롤 기준이라, body가
// 고정되고 안쪽 ScrollView가 스크롤되는 이 앱 구조에서는 감지되지 않는다.
// item_type/item_id는 'like' 이벤트와 동일한 맞춤 측정기준을 재사용하기 위한 것.
// 이 값이 바뀌면(다른 글/프로필로 이동) 도달 기록을 리셋한다.
export function useScrollDepthTracking(itemType: string, itemId: string | number) {
  const keyRef = useRef(`${itemType}:${itemId}`);
  const reachedRef = useRef<Set<number>>(new Set());

  const key = `${itemType}:${itemId}`;
  if (keyRef.current !== key) {
    keyRef.current = key;
    reachedRef.current = new Set();
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentSize.height <= layoutMeasurement.height) return;

    const scrolledPercent =
      ((contentOffset.y + layoutMeasurement.height) / contentSize.height) * 100;

    for (const threshold of THRESHOLDS) {
      if (scrolledPercent >= threshold && !reachedRef.current.has(threshold)) {
        reachedRef.current.add(threshold);
        trackEvent('scroll_depth', { item_type: itemType, item_id: itemId, percent: threshold });
      }
    }
  };

  return { onScroll, scrollEventThrottle: 200 };
}
