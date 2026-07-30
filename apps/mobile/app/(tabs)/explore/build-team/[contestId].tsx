import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '../../../../src/constants/colors';
import { ScreenHeader } from '../../../../src/components/common/ScreenHeader';
import { getContestDetail } from '../../../../src/services/contestService';
import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';
import { useMypageStore } from '../../../../src/store/useMypageStore';
import { MatchingProfileData } from '../../../../src/types/mypage';
import { formatRegionsLabel } from '../../../../src/utils/region';
import { formatMatchingCard } from '../../../../src/constants/matchingLabels';
import { trackEvent } from '../../../../src/services/gtm';

function formatCard(p: MatchingProfileData) {
  const region = p.regions.length > 0 ? formatRegionsLabel(p.regions) : '';
  return formatMatchingCard({ ...p, region });
}

// ── CardRow ───────────────────────────────────────────────────────────────────

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

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function BuildTeamCardScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const id = Number(contestId);
  const setContestId = useBuildTeamStore((s) => s.setContestId);
  const [contestTitle, setContestTitle] = useState('');

  const { matchingProfile, draftCard, loadMatchingProfile, loadProfile } = useMypageStore();
  const [isLoading, setIsLoading] = useState(true);

  // "수정"으로 고친 내용은 draftCard에만 담기고 라이브 매칭 프로필은 안 바뀌므로,
  // 미리보기는 draftCard를 우선하고 없으면 라이브 프로필을 보여준다.
  const displayCard = draftCard ?? matchingProfile;

  useEffect(() => {
    getContestDetail(id).then((d) => setContestTitle(d.title)).catch(() => {});
  }, [id]);

  // useEffect(마운트 1회)가 아니라 useFocusEffect를 쓰는 이유:
  // matching-profile 저장 후 router.replace로 이 화면에 돌아왔을 때도 다시 실행되어야
  // isLoading이 true에 갇히지 않음 (explore/post/[postId].tsx와 동일 패턴)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadProfile().then(() => {
        if (cancelled) return;
        const profile = useMypageStore.getState().profile;
        if (!profile || !profile.education) {
          // 활동 가능 지역은 이제 매칭 프로필(4단계)에서만 받으므로 여기서 체크하지 않는다.
          // 학력 미입력 → 마이페이지 기본정보 화면으로 이동
          router.replace(
            `/profile/edit-basic?returnTo=build-team&contestId=${id}` as never,
          );
          return;
        }

        loadMatchingProfile().then(() => {
          if (cancelled) return;
          const matching = useMypageStore.getState().matchingProfile;
          const draft = useMypageStore.getState().draftCard;
          if (!matching && !draft) {
            // 작성된 참여카드 없음 → 매칭 프로필 질문지(어필글 제외 6스텝)로 이동
            router.replace(
              `/profile/matching-profile?returnTo=build-team&contestId=${id}` as never,
            );
          } else {
            setIsLoading(false);
          }
        });
      });
      return () => { cancelled = true; };
    }, [id]),
  );

  const editStep = (step: number) => {
    router.push(
      `/profile/matching-profile?mode=edit&startStep=${step}&returnTo=build-team&contestId=${id}` as never,
    );
  };

  const handleNext = () => {
    trackEvent('recruit_conditions_start', { contest_id: id });
    setContestId(id);
    router.push(`/explore/build-team/recruit-count?contestId=${id}` as never);
  };

  if (isLoading || !displayCard) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const card = formatCard(displayCard);

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
            <Text style={styles.cardContestTitle}>{contestTitle}</Text>

            <View style={styles.divider} />

            <CardRow label="스킬" value={card.skills} onEdit={() => editStep(1)} />
            <CardRow label="참여 경험" value={card.experience} onEdit={() => editStep(2)} />
            <CardRow label="목적" value={card.purpose} onEdit={() => editStep(2)} />
            <CardRow label="강도" value={card.intensity} onEdit={() => editStep(3)} />
            <CardRow
              label="온오프라인선호"
              value={card.meetingPreference}
              onEdit={() => editStep(4)}
            />
            <CardRow label="팀분위기" value={card.teamVibe} onEdit={() => editStep(5)} />
            <CardRow label="리더십" value={card.leadership} onEdit={() => editStep(6)} />
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
