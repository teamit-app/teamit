import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';

export default function ParticipateCompleteScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── 상단: ogTint 배경 영역 ── */}
      <View style={styles.topSection}>
        <View style={styles.checkIconWrap}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.title}>팀매칭 후보로 등록됐어요!</Text>
        <Text style={styles.subtitle}>이제 모집자들이 내 카드를 볼 수 있어요</Text>
        <TouchableOpacity style={styles.waitingBadge} activeOpacity={0.85}>
          <Text style={styles.waitingBadgeText}>💌  제안 대기 중</Text>
        </TouchableOpacity>
      </View>

      {/* ── 하단: 흰 배경 영역 ── */}
      <View style={styles.bottomSection}>

        {/* 알림 토글 */}
        <View style={styles.notificationRow}>
          <Text style={styles.notificationLabel}>🔔  제안 알림 받기</Text>
          <Switch
            value={notificationEnabled}
            onValueChange={setNotificationEnabled}
            trackColor={{ false: Colors.lightGray, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {/* CTA 카드 */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push(`/explore/build-team/recruit-count?contestId=${contestId}` as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaTitle}>직접 팀을 꾸려보시겠어요?</Text>
          <Text style={styles.ctaSubtitle}>원하는 팀원을 한번에 찾을 수 있어요!</Text>
        </TouchableOpacity>

      </View>

      {/* ── 홈으로 가기 버튼 ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)/home' as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>홈으로 가기</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // 상단 ogTint 영역
  topSection: {
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  checkIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  checkMark: {
    fontSize: 44,
    color: Colors.white,
    fontWeight: '700',
    lineHeight: 52,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 24,
    textAlign: 'center',
  },
  waitingBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  waitingBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },

  // 하단 흰 영역
  bottomSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark,
  },
  ctaCard: {
    backgroundColor: Colors.ogTint,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: Colors.primary,
    opacity: 0.8,
  },

  // 하단 버튼
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
  },
  homeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
