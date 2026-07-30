import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { MatchingProfileData } from '../../../src/types/mypage';
import { formatRegionsLabel } from '../../../src/utils/region';
import { formatMatchingCard } from '../../../src/constants/matchingLabels';
import { trackEvent } from '../../../src/services/gtm';

function formatCard(p: MatchingProfileData) {
  const region = p.regions.length > 0 ? formatRegionsLabel(p.regions) : '';
  return formatMatchingCard({ ...p, region });
}

// ── CardRow ───────────────────────────────────────────────────────────────────

interface CardRowProps {
  label: string;
  value: string;
  onPressEdit: () => void;
}

function CardRow({ label, value, onPressEdit }: CardRowProps) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.left}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.value}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onPressEdit} hitSlop={8} activeOpacity={0.7}>
        <Text style={rowStyles.editText}>수정</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MatchingProfileCardScreen() {
  const insets = useSafeAreaInsets();
  const { matchingProfile, loadMatchingProfile } = useMypageStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatchingProfile().then(() => {
      const profile = useMypageStore.getState().matchingProfile;
      if (!profile) {
        // 작성된 매칭 프로필 없음 → 질문지 전체 플로우로 이동
        router.replace('/profile/matching-profile?returnTo=mypage-card' as never);
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const editStep = (step: number) => {
    router.push(
      `/profile/matching-profile?mode=edit&startStep=${step}&returnTo=mypage-card` as never,
    );
  };

  const handleDone = () => {
    trackEvent('matching_profile_submit');
    router.back();
  };

  if (isLoading || !matchingProfile) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const card = formatCard(matchingProfile);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="참여 카드 확인" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>최근 등록한 정보에요</Text>
        <Text style={styles.subtitle}>틀린 정보가 있으면 수정해 주세요</Text>

        <View style={styles.cardWrap}>
          <View style={styles.cardAccentBar} />
          <View style={styles.cardInner}>
            <Text style={styles.cardPreviewLabel}>참여 카드 미리보기</Text>

            <View style={styles.divider} />

            <CardRow label="스킬" value={card.skills} onPressEdit={() => editStep(1)} />
            <CardRow label="참여 경험" value={card.experience} onPressEdit={() => editStep(2)} />
            <CardRow label="목적" value={card.purpose} onPressEdit={() => editStep(2)} />
            <CardRow label="강도" value={card.intensity} onPressEdit={() => editStep(3)} />
            <CardRow
              label="온오프라인선호"
              value={card.meetingPreference}
              onPressEdit={() => editStep(4)}
            />
            <CardRow label="팀분위기" value={card.teamVibe} onPressEdit={() => editStep(5)} />
            <CardRow label="리더십" value={card.leadership} onPressEdit={() => editStep(6)} />

            {/* 어필글 */}
            <View style={rowStyles.row}>
              <View style={rowStyles.left}>
                <Text style={rowStyles.label}>어필글</Text>
                <Text style={rowStyles.appealTitle}>제목: {card.appealTitle}</Text>
                <Text style={rowStyles.appealContent}>내용: {card.appealContent}</Text>
              </View>
              <TouchableOpacity onPress={() => editStep(7)} hitSlop={8} activeOpacity={0.7}>
                <Text style={rowStyles.editText}>수정</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>저장하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.gray, marginBottom: 20 },
  cardWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  cardAccentBar: { height: 5, backgroundColor: Colors.primary },
  cardInner: { paddingTop: 16 },
  cardPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  left: { flex: 1 },
  label: { fontSize: 12, color: Colors.grayMedium, marginBottom: 5 },
  value: { fontSize: 14, color: Colors.dark, lineHeight: 20 },
  editText: { fontSize: 14, fontWeight: '500', color: Colors.primary, marginTop: 1 },
  appealTitle: { fontSize: 14, color: Colors.dark, lineHeight: 21, marginBottom: 4 },
  appealContent: { fontSize: 14, color: Colors.dark, lineHeight: 21 },
});
