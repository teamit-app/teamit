import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { useMypageStore } from '../../../src/store/useMypageStore';

function TemperatureBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(value / max, 1);
  return (
    <View>
      <View style={temp.valueRow}>
        <Text style={temp.valueBig}>{value}</Text>
        <Text style={temp.valueMax}> / {max}</Text>
      </View>
      <View style={temp.track}>
        <View style={[temp.fill, { width: `${pct * 100}%` as any }]} />
      </View>
      <View style={temp.scaleRow}>
        <Text style={temp.scaleText}>0</Text>
        <Text style={temp.scaleText}>{max}</Text>
      </View>
    </View>
  );
}

const temp = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  valueBig: { fontSize: 36, fontWeight: '800', color: Colors.primary, lineHeight: 40 },
  valueMax: { fontSize: 16, color: Colors.grayMedium, marginBottom: 4 },
  track: {
    height: 10,
    backgroundColor: '#EEEEEE',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: 10,
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  scaleText: { fontSize: 11, color: Colors.grayMedium },
});

function GridMenuItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={grid.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={grid.icon}>{icon}</Text>
      <Text style={grid.title}>{title}</Text>
      <Text style={grid.subtitle} numberOfLines={3}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const grid = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
  },
  icon: { fontSize: 22, marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 5 },
  subtitle: { fontSize: 12, color: Colors.grayMedium, lineHeight: 17 },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, isLoading, hasLoaded, loadProfile, setMatchingActive } = useMypageStore();

  useEffect(() => {
    loadProfile();
  }, []);

  if (isLoading && !hasLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 정보</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </View>
    );
  }

  const regionLabel = profile?.regions?.length
    ? `${profile.regions[0].sido}${profile.regions[0].sigungu ? ' ' + profile.regions[0].sigungu : ' 전체'}`
    : '-';

  const genderLabel = profile?.gender === 'MALE' ? '남성' : profile?.gender === 'FEMALE' ? '여성' : '';

  const educationLabel = profile?.education
    ? `${profile.education.schoolName} ${profile.education.major}`
    : '학력 미입력';

  const careerCount = profile?.careers?.length ?? 0;
  const careerSubtitle = careerCount > 0 ? `${careerCount}개 경험 등록됨` : '등록된 경험이 없어요';

  const hasMatchingProfile = (profile?.skills?.length ?? 0) > 0;
  const matchingSubtitle = hasMatchingProfile ? '역할, 스킬, 협업 스타일' : '아직 작성하지 않았어요';

  const matchingToggleSubtitle = profile?.isMatchingActive
    ? '팀 매칭 제안을 받는 중이에요'
    : '팀 매칭 제안을 받으세요';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle} />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nickname}>{profile?.nickname ?? '-'}</Text>
                {genderLabel ? (
                  <Text style={styles.genderText}>{genderLabel}</Text>
                ) : null}
              </View>
              <Text style={styles.educationText} numberOfLines={1}>{educationLabel}</Text>
              <View style={styles.regionRow}>
                <Text style={styles.regionPin}>📍</Text>
                <Text style={styles.regionText}>{regionLabel}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/(tabs)/profile/edit-basic')}
            >
              <Text style={styles.editBtnText}>수정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 티밋 온도 + 팀원 리뷰 */}
        <View style={styles.tempReviewCard}>
          <Text style={styles.tempTitle}>티밋 온도</Text>
          <TemperatureBar
            value={profile?.temperature ?? 0}
            max={profile?.maxTemperature ?? 40}
          />

          {(profile?.reviews?.length ?? 0) > 0 && (
            <>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewTitle}>💬 팀원 리뷰</Text>
                <Text style={styles.reviewCount}>{profile!.reviews.length}개</Text>
              </View>
              {profile!.reviews.map((r) => (
                <View key={r.reviewId} style={styles.reviewItem}>
                  <Text style={styles.reviewContent}>"{r.content}"</Text>
                  <Text style={styles.reviewMeta}>{r.contestName}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* 2×2 메뉴 그리드 */}
        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            <GridMenuItem
              icon="🎯"
              title="매칭 프로필"
              subtitle={matchingSubtitle}
              onPress={() => router.push('/(tabs)/profile/matching-profile')}
            />
            <GridMenuItem
              icon="💼"
              title="경험"
              subtitle={careerSubtitle}
              onPress={() => router.push('/(tabs)/profile/careers')}
            />
          </View>
          <View style={styles.gridRow}>
            <GridMenuItem
              icon="📋"
              title="나의 지원"
              subtitle="나의 팀후보로 등록한 공모전과 지원한 모집글을 확인해요"
              onPress={() => router.push('/(tabs)/profile/my-applications')}
            />
            <GridMenuItem
              icon="👥"
              title="내 모집글"
              subtitle="내가 작성한 모집글과 해당 공모전에 등록 후보를 확인해요"
              onPress={() => router.push('/(tabs)/profile/received-applications')}
            />
          </View>
        </View>

        {/* 제안 받기 */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTexts}>
              <Text style={styles.toggleTitle}>제안 받기</Text>
              <Text style={styles.toggleSubtitle}>{matchingToggleSubtitle}</Text>
            </View>
            <Switch
              value={profile?.isMatchingActive ?? false}
              onValueChange={(v) => setMatchingActive(v)}
              trackColor={{ false: Colors.lightGray, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.notifSection}>
          <TouchableOpacity
            style={styles.notifRow}
            onPress={() => router.push('/(tabs)/profile/notification-settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            <View style={styles.notifTexts}>
              <Text style={styles.notifTitle}>알림 설정</Text>
              <Text style={styles.notifSubtitle}>매칭 제안, 마감 알림 관리</Text>
            </View>
            <Text style={styles.notifArrow}>›</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: Colors.grayMedium },

  header: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },

  // Profile card
  profileCard: {
    backgroundColor: Colors.white,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D9D9D9',
    marginRight: 14,
  },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  nickname: { fontSize: 17, fontWeight: '800', color: Colors.dark },
  genderText: { fontSize: 12, color: Colors.gray },
  educationText: { fontSize: 13, color: Colors.gray, marginBottom: 3 },
  regionRow: { flexDirection: 'row', alignItems: 'center' },
  regionPin: { fontSize: 12, marginRight: 3 },
  regionText: { fontSize: 13, color: Colors.gray },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Temperature + review card (dashed orange border)
  tempReviewCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  tempTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 12 },
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  reviewCount: { fontSize: 13, color: Colors.grayMedium },
  reviewItem: { marginBottom: 10 },
  reviewContent: { fontSize: 14, color: Colors.dark, lineHeight: 20, fontWeight: '500' },
  reviewMeta: { fontSize: 12, color: Colors.grayMedium, marginTop: 2 },

  // 2x2 grid
  gridSection: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // 제안 받기
  toggleSection: {
    backgroundColor: Colors.white,
    marginBottom: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  toggleTexts: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 3 },
  toggleSubtitle: { fontSize: 12, color: Colors.grayMedium },

  // 알림 설정
  notifSection: {
    backgroundColor: Colors.white,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  notifIcon: { fontSize: 20, marginRight: 14 },
  notifTexts: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 3 },
  notifSubtitle: { fontSize: 12, color: Colors.grayMedium },
  notifArrow: { fontSize: 22, color: Colors.lightGray },
});
