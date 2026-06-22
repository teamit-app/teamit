import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';

import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';

const MIN = 1;
const MAX = 8;
const TOTAL_STEPS = 5;
const CURRENT_STEP = 1;

export default function RecruitCountScreen() {
  const insets = useSafeAreaInsets();
  const { contestId, returnToConfirm } = useLocalSearchParams<{ contestId: string; returnToConfirm: string }>();
  const count = useBuildTeamStore((s) => s.recruitCount);
  const setRecruitCount = useBuildTeamStore((s) => s.setRecruitCount);

  const dec = () => { if (count > MIN) setRecruitCount(count - 1); };
  const inc = () => { if (count < MAX) setRecruitCount(count + 1); };

  const goNext = () => {
    if (returnToConfirm === 'true') {
      router.push(`/explore/build-team/recruit-confirm?contestId=${contestId}` as never);
    } else {
      router.push(`/explore/build-team/recruit-skills?contestId=${contestId}` as never);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>모집 조건 설정</Text>
        <Text style={styles.stepText}>{CURRENT_STEP}/{TOTAL_STEPS}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>몇 명을 모집할까요?</Text>
        <Text style={styles.subtitle}>나를 제외한 팀원 수예요</Text>

        {/* 카운터 카드 */}
        <View style={styles.counterCard}>
          <Text style={styles.counterLabel}>모집 인원</Text>

          <View style={styles.counterRow}>
            <TouchableOpacity
              style={[styles.counterBtn, count <= MIN && styles.counterBtnDisabled]}
              onPress={dec}
              activeOpacity={0.8}
            >
              <Text style={styles.counterBtnMinus}>−</Text>
            </TouchableOpacity>

            <Text style={styles.countNumber}>{count}</Text>

            <TouchableOpacity
              style={[styles.counterBtnPlus, count >= MAX && styles.counterBtnDisabled]}
              onPress={inc}
              activeOpacity={0.8}
            >
              <Text style={styles.counterBtnPlusText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.totalHint}>나 포함 총 {count + 1}명</Text>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>다음</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { width: 32 },
  backIcon: { fontSize: 28, color: Colors.dark, lineHeight: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark,
  },
  stepText: {
    width: 32,
    textAlign: 'right',
    fontSize: 13,
    color: Colors.grayMedium,
  },

  // 진행 바
  progressBar: {
    height: 3,
    backgroundColor: Colors.lightGray,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
  },

  // 본문
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.gray },

  // 카운터 카드
  counterCard: {
    marginTop: 48,
    backgroundColor: Colors.pageBg,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  counterLabel: {
    fontSize: 14,
    color: Colors.grayMedium,
    marginBottom: 4,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },

  // 마이너스 버튼 (흰 배경, 회색 테두리)
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.grayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: { opacity: 0.3 },
  counterBtnMinus: { fontSize: 28, color: Colors.gray, lineHeight: 32 },

  // 플러스 버튼 (주황 배경)
  counterBtnPlus: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnPlusText: { fontSize: 28, color: Colors.white, lineHeight: 32 },

  countNumber: {
    fontSize: 52,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 64,
    textAlign: 'center',
    lineHeight: 60,
  },

  totalHint: {
    fontSize: 13,
    color: Colors.grayMedium,
    marginTop: 4,
  },

  // 하단
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
