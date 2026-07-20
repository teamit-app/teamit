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
import {
  getContestRegistrations,
  getPostApplications,
  cancelContestRegistration,
  cancelPostApplication,
} from '../../../src/services/mypageService';
import { ContestRegistration, PostApplication } from '../../../src/types/mypage';
import { useExploreStore } from '../../../src/store/useExploreStore';

type Tab = 'contest' | 'post';

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

function EmptyState() {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>아직 지원한 내역이 없어요</Text>
      <Text style={styles.emptyDesc}>공모전을 탐색하고 팀 매칭을 시작해보세요</Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Text style={styles.emptyBtnText}>공모전 탐색하기</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MyApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('contest');
  const [registrations, setRegistrations] = useState<ContestRegistration[]>([]);
  const [postApps, setPostApps] = useState<PostApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const unmarkContestParticipant = useExploreStore((s) => s.unmarkContestParticipant);

  useEffect(() => {
    Promise.all([getContestRegistrations(), getPostApplications()])
      .then(([regs, apps]) => {
        setRegistrations(regs);
        setPostApps(apps);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCancelRegistration = (reg: ContestRegistration) => {
    Alert.alert(
      '후보 등록 취소',
      '후보 등록을 취소하면 공모전 후보 목록에서 삭제돼요.\n이 공모전에 작성한 모집글이 있다면 함께 삭제돼요.\n취소하시겠어요?',
      [
        { text: '아니요', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            await cancelContestRegistration(reg.contestId);
            unmarkContestParticipant(reg.contestId);
            setRegistrations((prev) =>
              prev.filter((r) => r.registrationId !== reg.registrationId),
            );
          },
        },
      ],
    );
  };

  const handleCancelApplication = (app: PostApplication) => {
    Alert.alert(
      '지원 취소',
      '지원을 취소해도 공모전 후보 등록은 계속 유지돼요.\n지원을 취소하시겠어요?',
      [
        { text: '아니요', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            await cancelPostApplication(app.applicationId);
            setPostApps((prev) =>
              prev.filter((a) => a.applicationId !== app.applicationId),
            );
          },
        },
      ],
    );
  };

  const renderContestTab = () => {
    if (registrations.length === 0) return <EmptyState />;
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {registrations.map((reg) => (
          <TouchableOpacity
            key={reg.registrationId}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/profile/participant-card',
                params: { registrationId: reg.registrationId },
              })
            }
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{reg.contestTitle}</Text>
              <DDayBadge dDay={reg.dDay} />
            </View>
            <Text style={styles.cardOrg}>주최: {reg.organizer}</Text>
            <Text style={styles.cardDate}>참여카드 등록일: {reg.registeredAt}</Text>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelRegistration(reg)}
              hitSlop={8}
            >
              <Text style={styles.cancelBtnText}>제출 취소</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderPostTab = () => {
    if (postApps.length === 0) return <EmptyState />;
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {postApps.map((app) => (
          <TouchableOpacity
            key={app.applicationId}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/profile/post/[postId]',
                params: {
                  postId: app.postId,
                  contestId: app.contestId,
                  appliedStatus: 'applied',
                  applicationId: app.applicationId,
                },
              })
            }
          >
            <Text style={styles.cardContest}>{app.contestTitle}</Text>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{app.postTitle}</Text>
            </View>
            <Text style={styles.cardOrg}>작성자: {app.authorNickname}</Text>
            <Text style={styles.cardDate}>지원일: {app.appliedAt}</Text>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelApplication(app)}
              hitSlop={8}
            >
              <Text style={styles.cancelBtnText}>지원 취소</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="나의 지원" onBack={() => router.back()} />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'contest' && styles.tabActive]}
          onPress={() => setTab('contest')}
        >
          <Text style={[styles.tabText, tab === 'contest' && styles.tabTextActive]}>
            공모전 후보 등록 내역
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'post' && styles.tabActive]}
          onPress={() => setTab('post')}
        >
          <Text style={[styles.tabText, tab === 'post' && styles.tabTextActive]}>
            게시글 지원 내역
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      ) : tab === 'contest' ? renderContestTab() : renderPostTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },

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
  tabText: { fontSize: 13, color: Colors.grayMedium },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontSize: 14, color: Colors.grayMedium },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: Colors.gray, textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardContest: { fontSize: 12, color: Colors.gray, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.dark, marginRight: 8 },
  cardOrg: { fontSize: 13, color: Colors.gray, marginBottom: 2 },
  cardDate: { fontSize: 13, color: Colors.grayMedium, marginBottom: 10 },
  cancelBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: Colors.grayMedium },
});
