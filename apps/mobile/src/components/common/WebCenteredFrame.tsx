import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsWideScreen } from '../../hooks/useIsWideScreen';
import { Colors } from '../../constants/colors';

const MOBILE_FRAME_WIDTH = 480;

// PC 브라우저에서 모바일 화면을 그대로 가운데 정렬해서 보여주기 위한 래퍼.
// 데스크톱 전용 레이아웃 재설계는 범위 밖 — 여기서는 폭만 제한한다.
// 주의: react-native-web의 Modal은 포탈로 렌더링되어 이 프레임 바깥(브라우저 전체 폭)에
// 붙을 수 있음 — 베타테스트 범위에서는 기능 확인이 목적이라 손대지 않는다.
export function WebCenteredFrame({ children }: { children: React.ReactNode }) {
  const isWide = useIsWideScreen();

  if (!isWide) {
    return <>{children}</>;
  }

  return (
    <View style={styles.backdrop}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.pageBg,
  },
  frame: {
    flex: 1,
    width: MOBILE_FRAME_WIDTH,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
  },
});
