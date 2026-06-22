import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { ScreenHeader } from '../../../../src/components/common/ScreenHeader';
import { dummyContestDetails } from '../../../../src/data/recruitmentPosts';
import { dummyParticipationCard } from '../../../../src/data/recruitmentPosts';
import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';

function CardRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.left}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.value}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={8} activeOpacity={0.7}>
        <Text style={rowStyles.editText}>수정</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BuildTeamCardScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const id = Number(contestId);
  const setContestId = useBuildTeamStore((s) => s.setContestId);

  const detail = dummyContestDetails.find((d) => d.contestId === id) ?? dummyContestDetails[0];
  const card = dummyParticipationCard;

  const handleNext = () => {
    setContestId(id);
    router.push(`/explore/build-team/recruit-count?contestId=${id}` as never);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="참여 카드 확인" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>모집자님에 대해 알려주세요</Text>
        <Text style={styles.subtitle}>틀린 정보가 있으면 수정해 주세요</Text>

        <View style={styles.cardWrap}>
          <View style={styles.cardAccentBar} />
          <View style={styles.cardInner}>
            <Text style={styles.cardPreviewLabel}>참여 카드 미리보기</Text>
            <Text style={styles.cardContestTitle}>{detail.title}</Text>

            <View style={styles.divider} />

            <CardRow label="스킬" value={card.skills} onEdit={() => {}} />
            <CardRow label="목적" value={card.purpose} onEdit={() => {}} />
            <CardRow label="강도" value={card.intensity} onEdit={() => {}} />
            <CardRow
              label="온오프라인선호"
              value={`${card.meetingPreference} · ${card.location}`}
              onEdit={() => {}}
            />
            <CardRow label="팀분위기" value={card.teamVibe} onEdit={() => {}} />
            <CardRow label="리더십" value={card.leadership} onEdit={() => {}} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>모집 조건 작성하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.gray, marginBottom: 24 },
  cardWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  cardAccentBar: { height: 5, backgroundColor: Colors.primary },
  cardInner: { paddingTop: 16 },
  cardPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  cardContestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: '#F0F0F0' },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  left: { flex: 1 },
  label: { fontSize: 12, color: Colors.grayMedium, marginBottom: 4 },
  value: { fontSize: 14, color: Colors.dark, lineHeight: 20 },
  editText: { fontSize: 14, fontWeight: '500', color: Colors.primary },
});
