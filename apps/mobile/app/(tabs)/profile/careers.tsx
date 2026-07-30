import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Alert } from '../../../src/utils/alert';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { ContestCareer, CertificateCareer } from '../../../src/types/mypage';
import { trackEvent } from '../../../src/services/gtm';

type Tab = 'contest' | 'certificate';

const AWARD_LABEL: Record<string, string> = {
  AWARDED: '수상',
  NOT_AWARDED: '미수상',
  PARTICIPATED: '참여',
};

function AwardBadge({ status }: { status: string }) {
  const isAwarded = status === 'AWARDED';
  return (
    <View
      style={[
        awardSt.badge,
        isAwarded ? awardSt.awardedBg : awardSt.defaultBg,
      ]}
    >
      <Text
        style={[
          awardSt.text,
          isAwarded ? awardSt.awardedText : awardSt.defaultText,
        ]}
      >
        {isAwarded ? '🏆 ' : ''}
        {AWARD_LABEL[status] ?? status}
      </Text>
    </View>
  );
}

const awardSt = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  awardedBg: { backgroundColor: Colors.ogTint },
  defaultBg: { backgroundColor: Colors.pageBg },
  text: { fontSize: 12, fontWeight: '700' },
  awardedText: { color: Colors.primary },
  defaultText: { color: Colors.gray },
});

function ContestCareerCard({
  item,
  onPress,
  onDelete,
}: {
  item: ContestCareer;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>🏆</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.contestName}
        </Text>
        <Text style={styles.cardMeta}>역할: {item.roles.join(', ')}</Text>
        <Text style={styles.cardMeta}>
          {item.startDate} ~ {item.endDate}
        </Text>
        <AwardBadge status={item.awardStatus} />
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteBtnText}>삭제</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function CertificateCareerCard({
  item,
  onPress,
  onDelete,
}: {
  item: CertificateCareer;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>📜</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.certName}
        </Text>
        <Text style={styles.cardMeta}>{item.issuingOrg}</Text>
        <Text style={styles.cardMeta}>취득일: {item.acquiredDate}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteBtnText}>삭제</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function CareersScreen() {
  const insets = useSafeAreaInsets();
  const { profile, hasLoaded, loadProfile, removeCareer } = useMypageStore();
  const [tab, setTab] = useState<Tab>('contest');

  const handleTabPress = (key: Tab) => {
    trackEvent('tab_select', { tab_group: 'careers_menu', tab_name: key, from_tab: tab });
    setTab(key);
  };

  useEffect(() => {
    if (!hasLoaded) loadProfile();
  }, []);

  const careers = profile?.careers ?? [];
  const contests = careers.filter(
    (c): c is ContestCareer => c.careerType === 'CONTEST',
  );
  const certificates = careers.filter(
    (c): c is CertificateCareer => c.careerType === 'CERTIFICATE',
  );

  const handleDelete = (careerItemId: number, careerType: 'contest' | 'certificate') => {
    Alert.alert('삭제', '이 경험을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          removeCareer(careerItemId)
            .then(() => trackEvent('career_delete', { item_type: careerType }))
            .catch(() => Alert.alert('오류', '삭제에 실패했어요.')),
      },
    ]);
  };

  const isContest = tab === 'contest';
  const currentList = isContest ? contests : certificates;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="경험"
        onBack={() => router.back()}
        rightElement={
          <TouchableOpacity
            onPress={() =>
              router.push('/(tabs)/profile/add-experience' as never)
            }
          >
            <Text style={styles.addBtn}>+ 추가</Text>
          </TouchableOpacity>
        }
      />

      {/* 탭 바 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, isContest && styles.tabActive]}
          onPress={() => handleTabPress('contest')}
        >
          <Text
            style={[styles.tabText, isContest && styles.tabTextActive]}
          >
            공모전
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !isContest && styles.tabActive]}
          onPress={() => handleTabPress('certificate')}
        >
          <Text
            style={[styles.tabText, !isContest && styles.tabTextActive]}
          >
            자격증
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {currentList.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{isContest ? '🏆' : '📜'}</Text>
            <Text style={styles.emptyTitle}>
              {isContest
                ? '등록된 공모전이 없어요'
                : '등록된 자격증이 없어요'}
            </Text>
            <Text style={styles.emptyDesc}>
              {isContest
                ? '공모전 참여 경험을 등록해보세요'
                : '취득한 자격증을 등록해보세요'}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() =>
                router.push('/(tabs)/profile/add-experience' as never)
              }
            >
              <Text style={styles.emptyBtnText}>경험 추가하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listSection}>
            {isContest
              ? contests.map((item) => (
                  <ContestCareerCard
                    key={item.careerItemId}
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/profile/add-contest',
                        params: {
                          careerItemId: item.careerItemId,
                          contestName: item.contestName,
                          roles: item.roles.join(','),
                          startDate: item.startDate,
                          endDate: item.endDate,
                          awardStatus: item.awardStatus,
                        },
                      } as never)
                    }
                    onDelete={() => handleDelete(item.careerItemId, 'contest')}
                  />
                ))
              : certificates.map((item) => (
                  <CertificateCareerCard
                    key={item.careerItemId}
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/profile/add-certificate',
                        params: {
                          careerItemId: item.careerItemId,
                          certName: item.certName,
                          issuingOrg: item.issuingOrg,
                          acquiredDate: item.acquiredDate,
                        },
                      } as never)
                    }
                    onDelete={() => handleDelete(item.careerItemId, 'certificate')}
                  />
                ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  content: { paddingBottom: 32 },

  addBtn: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.grayMedium },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  listSection: { marginTop: 8 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 16,
    padding: 14,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  iconEmoji: { fontSize: 18 },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  cardMeta: { fontSize: 13, color: Colors.gray, marginBottom: 2 },
  deleteBtn: { paddingLeft: 8, paddingTop: 2 },
  deleteBtnText: { fontSize: 13, color: Colors.error },
});
