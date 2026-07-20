import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';

export default function MatchingLoadingScreen() {
  const insets = useSafeAreaInsets();
  const { contestId, postId } = useLocalSearchParams<{ contestId: string; postId?: string }>();

  const scale = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.35)).current;
  const dot2 = useRef(new Animated.Value(0.35)).current;
  const dot3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    // 아이콘 펄스
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.07,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 점 순차 애니메이션
    const dotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 350,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(900 - delay),
        ])
      );
    dotAnim(dot1, 0).start();
    dotAnim(dot2, 300).start();
    dotAnim(dot3, 600).start();

    // 3초 후 자동 이동
    const timer = setTimeout(() => {
      router.replace(`/explore/build-team/candidates?contestId=${contestId}&postId=${postId ?? ''}` as never);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* 배경 장식 원 */}
      <View style={styles.bgCircleTopLeft} />
      <View style={styles.bgCircleTopRight} />
      <View style={styles.bgCircleBottomLeft} />

      {/* 본문 */}
      <View style={styles.body}>
        {/* 아이콘 */}
        <Animated.View style={[styles.outerCircle, { transform: [{ scale }] }]}>
          <View style={styles.innerCircle}>
            <Text style={styles.icon}>🔍</Text>
          </View>
        </Animated.View>

        {/* 점 3개 */}
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>

        {/* 텍스트 */}
        <Text style={styles.title}>매칭 중이에요</Text>
        <Text style={styles.subtitle}>모집 조건에 맞는 팀원을 찾고 있어요</Text>

        <Text style={styles.hint}>워크스타일, 협업선호를 모두 고려해 찾는 중이에요</Text>
      </View>

      {/* 취소 버튼 */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>취소하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BLOB = 280;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // 배경 장식
  bgCircleTopLeft: {
    position: 'absolute',
    width: BLOB,
    height: BLOB,
    borderRadius: BLOB / 2,
    backgroundColor: Colors.ogTint,
    top: -BLOB * 0.38,
    left: -BLOB * 0.35,
  },
  bgCircleTopRight: {
    position: 'absolute',
    width: BLOB * 0.75,
    height: BLOB * 0.75,
    borderRadius: (BLOB * 0.75) / 2,
    backgroundColor: Colors.ogTint,
    top: -BLOB * 0.15,
    right: -BLOB * 0.2,
  },
  bgCircleBottomLeft: {
    position: 'absolute',
    width: BLOB * 0.85,
    height: BLOB * 0.85,
    borderRadius: (BLOB * 0.85) / 2,
    backgroundColor: Colors.ogTint,
    bottom: -BLOB * 0.42,
    left: -BLOB * 0.25,
  },

  // 중앙 콘텐츠
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },

  // 아이콘
  outerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  innerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 42 },

  // 점
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  // 텍스트
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray,
    marginBottom: 40,
  },
  hint: {
    fontSize: 13,
    color: Colors.grayLight,
    textAlign: 'center',
  },

  // 하단 버튼
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
  },
  cancelBtn: {
    backgroundColor: Colors.pageBg,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
});
