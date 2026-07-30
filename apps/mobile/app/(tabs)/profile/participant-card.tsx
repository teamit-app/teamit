import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Alert } from '../../../src/utils/alert';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { getContestRegistrations, cancelContestRegistration } from '../../../src/services/mypageService';
import { registerAsParticipant } from '../../../src/services/contestService';
import { getMyPosts } from '../../../src/services/postService';
import { ContestRegistration } from '../../../src/types/mypage';
import { formatMatchingCard } from '../../../src/constants/matchingLabels';
import { unmarkContestParticipant } from '../../../src/hooks/useExploreData';

function DDayBadge({ dDay }: { dDay: number }) {
  if (dDay < 0) {
    return (
      <View style={badge.closed}>
        <Text style={badge.closedText}>마감</Text>
      </View>
    );
  }
  return (
    <View style={badge.open}>
      <Text style={badge.openText}>D-{dDay}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  open: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: Colors.ogTint,
  },
  openText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  closed: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: Colors.pageBg,
  },
  closedText: { fontSize: 12, fontWeight: '600', color: Colors.grayMedium },
});

function CardField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function ParticipantCardScreen() {
  const insets = useSafeAreaInsets();
  const { registrationId } = useLocalSearchParams<{ registrationId: string }>();

  const [registration, setRegistration] = useState<ContestRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsResubmit, setNeedsResubmit] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const isMounted = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // 첫 마운트 이후 다시 포커스 → 수정하고 돌아온 것으로 간주
      if (isMounted.current) setNeedsResubmit(true);
      isMounted.current = true;

      setLoading(true);
      getContestRegistrations()
        .then((list) => {
          const found = list.find((r) => r.registrationId === Number(registrationId));
          setRegistration(found ?? null);
        })
        .finally(() => setLoading(false));
    }, [registrationId]),
  );

  // 이 공모전에 내가 올린 모집글이 있고 이미 팀원이 합류했다면, 참여 카드를 바꾸면
  // 그 모집글의 매칭 기준(모집자 스냅샷)이 어긋나므로 수정 자체를 막는다
  // (서버 registerParticipant도 동일하게 막아주지만, 여기서 미리 막아 불필요한 입력을 방지)
  const checkCardEditable = async (contestId: number): Promise<boolean> => {
    try {
      const myPosts = await getMyPosts();
      const myPost = myPosts.find((p) => p.contestId === contestId);
      if (myPost && (myPost.currentMembers ?? 1) > 1) {
        Alert.alert(
          '수정할 수 없어요',
          '이 공모전에 올린 모집글에 이미 합류한 팀원이 있어서 참여 카드를 수정할 수 없어요.',
        );
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const handleResubmit = async () => {
    if (!registration) return;
    if (!(await checkCardEditable(registration.contestId))) return;
    setResubmitting(true);
    try {
      await registerAsParticipant(registration.contestId);
      setNeedsResubmit(false);
    } catch {
      Alert.alert('제출 실패', '참여 카드를 제출하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="참여 카드 확인" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.centerText}>불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (!registration) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="참여 카드 확인" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.centerText}>데이터를 찾을 수 없어요</Text>
        </View>
      </View>
    );
  }

  const card = formatMatchingCard(registration.participantCard);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="참여 카드 확인" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 84 }}
      >
        <View style={styles.subtitleSection}>
          <Text style={styles.subtitleMain}>내 참여 카드 정보</Text>
          <Text style={styles.subtitleSub}>공모전에 후보로 등록한 내 카드 정보에요</Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewCardHeader}>
            <Text style={styles.previewCardHeaderText} numberOfLines={2}>
              {registration.contestTitle}
            </Text>
            <TouchableOpacity
              onPress={async () => {
                if (!(await checkCardEditable(registration.contestId))) return;
                router.push(
                  `/(tabs)/profile/matching-profile?returnTo=participant-card&contestId=${registration.contestId}` as never,
                );
              }}
            >
              <Text style={styles.headerEditBtn}>수정</Text>
            </TouchableOpacity>
          </View>

          <CardField label="스킬" value={card.skills} />
          <CardField label="참여 경험" value={card.experience} />
          <CardField label="목적" value={card.purpose} />
          <CardField label="강도" value={card.intensity} />
          <CardField label="온오프라인선호" value={card.meetingPreference} />
          {card.teamVibe ? <CardField label="팀분위기" value={card.teamVibe} /> : null}
          <CardField label="리더십" value={card.leadership} />

          <View style={styles.appealSection}>
            <Text style={styles.fieldLabel}>어필글</Text>
            <Text style={styles.appealTitle}>{card.appealTitle}</Text>
            <Text style={styles.appealContent}>{card.appealContent}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.contestInfoCard}
          activeOpacity={0.7}
          onPress={() =>
            router.push(`/(tabs)/explore/contest/${registration.contestId}` as any)
          }
        >
          <Text style={styles.contestInfoTitle}>{registration.contestTitle}</Text>
          <View style={styles.contestDeadlineRow}>
            <Text style={styles.contestDeadlineLabel}>마감: {registration.endDate}</Text>
            <DDayBadge dDay={registration.dDay} />
          </View>
          <Text style={styles.contestRegisteredAt}>후보 등록일 {registration.registeredAt}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 16 }]}>
        {needsResubmit ? (
          <TouchableOpacity
            style={styles.ctaBtnResubmit}
            onPress={handleResubmit}
            disabled={resubmitting}
          >
            <Text style={styles.ctaBtnResubmitText}>
              {resubmitting ? '제출 중...' : '제출 완료'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.ctaBtnDone}>
            <Text style={styles.ctaBtnDoneText}>제출 완료</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.ctaBtnCancel}
          onPress={() => {
            Alert.alert(
              '후보 등록 취소',
              '후보 등록을 취소하면 공모전 후보 목록에서 삭제돼요.\n이 공모전에 작성한 모집글이 있다면 함께 삭제돼요.\n취소하시겠어요?',
              [
                { text: '아니요', style: 'cancel' },
                {
                  text: '취소하기',
                  style: 'destructive',
                  onPress: async () => {
                    await cancelContestRegistration(registration.contestId);
                    unmarkContestParticipant(registration.contestId);
                    router.back();
                  },
                },
              ],
            );
          }}
        >
          <Text style={styles.ctaBtnCancelText}>제출 취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 14, color: Colors.grayMedium },

  subtitleSection: {
    padding: 16,
  },
  subtitleMain: { fontSize: 16, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  subtitleSub: { fontSize: 14, color: Colors.gray },

  previewCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewCardHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewCardHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 20,
  },
  headerEditBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.9,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  fieldLabel: { fontSize: 13, color: Colors.gray, width: 80 },
  fieldValue: { flex: 1, fontSize: 14, color: Colors.dark, fontWeight: '500' },

  appealSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  appealTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginTop: 8 },
  appealContent: { fontSize: 14, color: Colors.gray, lineHeight: 22, marginTop: 4 },

  contestInfoCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  contestInfoTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  contestDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contestDeadlineLabel: { fontSize: 13, color: Colors.gray },
  contestRegisteredAt: { fontSize: 13, color: Colors.gray },

  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    gap: 8,
  },
  ctaBtnDone: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDoneText: { fontSize: 15, fontWeight: '700', color: Colors.grayMedium },
  ctaBtnResubmit: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnResubmitText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  ctaBtnCancel: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E57373',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnCancelText: { fontSize: 14, fontWeight: '600', color: '#E57373' },
});
