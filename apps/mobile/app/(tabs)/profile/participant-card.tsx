import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { getContestRegistrations } from '../../../src/services/mypageService';
import { ContestRegistration, ParticipantCardData } from '../../../src/types/mypage';

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

  useEffect(() => {
    getContestRegistrations()
      .then((list) => {
        const found = list.find((r) => r.registrationId === Number(registrationId));
        setRegistration(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [registrationId]);

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

  const card: ParticipantCardData = registration.participantCard;

  const onlineOfflineValue =
    card.onlineOffline === '오프라인' || card.onlineOffline === '혼합'
      ? `${card.onlineOffline} (${card.region})`
      : card.onlineOffline;

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
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile/matching-profile')}>
              <Text style={styles.headerEditBtn}>수정</Text>
            </TouchableOpacity>
          </View>

          <CardField label="스킬" value={card.skills.join(', ')} />
          <CardField label="경험" value={card.experienceCount} />
          <CardField label="강도" value={card.intensity} />
          <CardField label="온오프라인" value={onlineOfflineValue} />
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
        <View style={styles.ctaBtnDone}>
          <Text style={styles.ctaBtnDoneText}>제출 완료</Text>
        </View>
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
  },
  ctaBtnDone: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDoneText: { fontSize: 16, fontWeight: '700', color: Colors.grayMedium },
});
