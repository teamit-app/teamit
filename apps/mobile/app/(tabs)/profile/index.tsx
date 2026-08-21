import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Alert } from '../../../src/utils/alert';
import { Colors } from '../../../src/constants/colors';
import { useMypageStore } from '../../../src/store/useMypageStore';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { refreshExploreTalents } from '../../../src/hooks/useExploreData';
import { logout as logoutApi, withdraw as withdrawApi } from '../../../src/services/authService';
import { uploadProfileImage, deleteProfileImage } from '../../../src/services/mypageService';
import { formatRegionsLabel } from '../../../src/utils/region';
import { resolveImageUrl } from '../../../src/utils/imageUrl';
import { EDUCATION_STATUS_LABEL } from '../../../src/constants/education';
import { ReviewStatsCard } from '../../../src/components/profile/ReviewStatsCard';
import { buildReviewStats, buildReviewKeywords } from '../../../src/utils/reviewStats';
import { useMyReceivedReviews } from '../../../src/hooks/useMyReceivedReviews';
import { GuestPrompt } from '../../../src/components/common/GuestPrompt';
import { trackEvent } from '../../../src/services/gtm';

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
  const { profile, isLoading, hasLoaded, loadProfile, reloadProfile, setMatchingActive } = useMypageStore();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── 지금까지 받은 모든 리뷰의 항목별 평균 ──
  const MY_USER_ID = useAuthStore((s) => s.currentUserId);
  const currentUserIdReady = useAuthStore((s) => s.currentUserIdReady);
  const { reviews: receivedReviews, isLoading: reviewStatsLoading } = useMyReceivedReviews(MY_USER_ID);

  useEffect(() => {
    if (MY_USER_ID) loadProfile();
  }, [MY_USER_ID]);

  const pickAndUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요해요');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileName = asset.fileName ?? `profile.${asset.mimeType?.split('/')[1] ?? 'jpg'}`;
    setUploadingPhoto(true);
    try {
      await uploadProfileImage(asset.uri, fileName);
      await reloadProfile();
    } catch {
      Alert.alert('오류', '프로필 사진 등록에 실패했어요. 다시 시도해주세요.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert('사진 삭제', '프로필 사진을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setUploadingPhoto(true);
          try {
            await deleteProfileImage();
            await reloadProfile();
          } catch {
            Alert.alert('오류', '프로필 사진 삭제에 실패했어요. 다시 시도해주세요.');
          } finally {
            setUploadingPhoto(false);
          }
        },
      },
    ]);
  };

  const handleChangePhoto = () => {
    if (!profile?.profileImageUrl) {
      pickAndUploadPhoto();
      return;
    }
    Alert.alert('프로필 사진', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '사진 변경', onPress: pickAndUploadPhoto },
      { text: '사진 삭제', style: 'destructive', onPress: handleRemovePhoto },
    ]);
  };

  const reviewStats = buildReviewStats(receivedReviews);
  const reviewKeywords = buildReviewKeywords(receivedReviews);

  if (currentUserIdReady) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 정보</Text>
        </View>
      </View>
    );
  }

  if (!MY_USER_ID) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 정보</Text>
        </View>
        <GuestPrompt returnPath="/(tabs)/profile" />
      </View>
    );
  }

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
    ? formatRegionsLabel(profile.regions)
    : '-';

  const genderLabel = profile?.gender === 'MALE' ? '남성' : profile?.gender === 'FEMALE' ? '여성' : '';

  const educationLabel = profile?.education
    ? `${profile.education.schoolName} ${profile.education.major} · ${EDUCATION_STATUS_LABEL[profile.education.status]}`
    : '학력 미입력';

  const careerCount = profile?.careers?.length ?? 0;
  const careerSubtitle = careerCount > 0 ? `${careerCount}개 경험 등록됨` : '등록된 경험이 없어요';

  const hasMatchingProfile = (profile?.skills?.length ?? 0) > 0;
  const matchingSubtitle = hasMatchingProfile
    ? '인재풀에 보여줄 내 프로필이에요'
    : '작성된 프로필이 없어요';

  const matchingToggleSubtitle = profile?.isMatchingActive
    ? '인재풀에 등록되어 팀 초대를 받고 있어요'
    : '켜면 인재풀에 등록되고 팀 초대를 받을 수 있어요';

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: async () => {
          try {
            await logoutApi();
          } finally {
            useAuthStore.getState().logout();
            // 로그인은 필요할 때만 요구하는 흐름이라, 로그아웃 후에도 로그인 화면으로 보내지
            // 않고 게스트로 홈에 남겨둔다.
            router.replace('/(tabs)/home');
          }
        },
      },
    ]);
  };

  const handleWithdraw = () => {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴하면 모든 정보가 삭제되며 복구할 수 없어요. 정말 탈퇴하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdrawApi();
            } catch {
              // 서버에서 탈퇴가 실패했는데도 로컬을 로그아웃 상태로 만들어버리면
              // 실제로는 탈퇴가 안 됐는데 탈퇴된 것처럼 보이는 문제가 생긴다 —
              // 실패 시엔 로그인 상태를 그대로 두고 재시도할 수 있게 한다.
              Alert.alert('오류', '탈퇴 처리 중 문제가 발생했어요. 다시 시도해주세요.');
              return;
            }
            useAuthStore.getState().logout('withdraw');
            router.replace('/(tabs)/home');
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={handleChangePhoto}
              activeOpacity={0.8}
              disabled={uploadingPhoto}
            >
              {resolveImageUrl(profile?.profileImageUrl) ? (
                <Image
                  source={{ uri: resolveImageUrl(profile?.profileImageUrl)! }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarPlaceholder}>🧑‍💻</Text>
              )}
              <View style={styles.avatarEditBadge}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.avatarEditIcon}>📷</Text>
                )}
              </View>
            </TouchableOpacity>
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

        {/* 티밋 온도 + 받은 리뷰 (상세정보 화면과 동일한 카드 디자인) */}
        <ReviewStatsCard
          averageRating={profile?.averageRating ?? 0}
          stats={reviewStats}
          keywords={reviewKeywords}
          reviewCount={receivedReviews.filter((r) => r.comment).length}
          onPressReviews={() => router.push('/(tabs)/profile/all-reviews')}
          emptyText={reviewStatsLoading ? '불러오는 중...' : '아직 받은 리뷰가 없어요'}
        />

        {/* 2×2 메뉴 그리드 */}
        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            <GridMenuItem
              icon="🎯"
              title="매칭 프로필"
              subtitle={matchingSubtitle}
              onPress={() => router.push('/(tabs)/profile/matching-profile-card')}
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

        {/* 좋아요 목록 */}
        <View style={styles.notifSection}>
          <TouchableOpacity
            style={styles.notifRow}
            onPress={() => router.push('/(tabs)/profile/likes')}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>🤍</Text>
            <View style={styles.notifTexts}>
              <Text style={styles.notifTitle}>좋아요 목록</Text>
              <Text style={styles.notifSubtitle}>좋아요한 인재풀, 공모전, 모집글</Text>
            </View>
            <Text style={styles.notifArrow}>›</Text>
          </TouchableOpacity>
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
              onValueChange={async (v) => {
                await setMatchingActive(v);
                trackEvent(v ? 'matching_active_enable' : 'matching_active_disable');
                // 인재풀 목록은 세션 내내 캐시되는 값이라, 여기서 껐다 켰다 해도
                // 다시 로그인하기 전까지는 탐색 탭에 그대로 남아있던 문제를 고치기 위함
                refreshExploreTalents();
              }}
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

        {/* 계정 관리 */}
        <View style={styles.notifSection}>
          <TouchableOpacity
            style={styles.notifRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>🚪</Text>
            <View style={styles.notifTexts}>
              <Text style={styles.notifTitle}>로그아웃</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notifRow}
            onPress={handleWithdraw}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>🚫</Text>
            <View style={styles.notifTexts}>
              <Text style={[styles.notifTitle, styles.withdrawText]}>회원 탈퇴</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 문의 안내 */}
        <View style={styles.contactSection}>
          <Text style={styles.contactText}>
            추가하고 싶으신 공모전 및 문의사항은 아래 이메일로 보내주세요 {'\n'} specit.biz@gmail.com 
          </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    fontSize: 26,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarEditIcon: {
    fontSize: 11,
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
  withdrawText: { color: Colors.error },

  // 문의 안내
  contactSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  contactText: {
    fontSize: 12,
    color: Colors.grayMedium,
    textAlign: 'center',
    lineHeight: 18,
  },
});
