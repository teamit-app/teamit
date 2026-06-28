import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { getPostApplicants, getContestCandidates } from '../../../src/services/mypageService';
import { PostApplicant } from '../../../src/types/mypage';

const MOCK_REVIEWS = [
  { id: 1, content: '소통이 빨라서 협업하기 편했어요.', contestName: '국립중앙도서관 데이터 활용 공모전' },
  { id: 2, content: '책임감 있게 끝까지 함께해줬어요.', contestName: '2025 대학생 창업 아이디어 공모전' },
  { id: 3, content: '아이디어가 넘쳐서 팀에 활력을 줬어요.', contestName: 'SW 해커톤 2025 봄' },
];

const MOCK_CAREERS = [
  { type: 'contest', title: '2024 대학생 창업 아이디어 공모전', sub: '역할: 기획', badge: '수상' },
  { type: 'cert', title: 'SQLD (SQL 개발자)', sub: '취득일: 26.03.22' },
];

function TemperatureBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(value / max, 1);
  return (
    <View>
      <View style={temp.row}>
        <Text style={temp.big}>{value}</Text>
        <Text style={temp.max}> / {max}</Text>
      </View>
      <View style={temp.track}>
        <View style={[temp.fill, { width: `${pct * 100}%` as any }]} />
      </View>
    </View>
  );
}

const temp = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  big: { fontSize: 30, fontWeight: '800', color: Colors.primary, lineHeight: 34 },
  max: { fontSize: 14, color: Colors.grayMedium, marginBottom: 2 },
  track: { height: 8, backgroundColor: '#EEEEEE', borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detail.infoRow}>
      <Text style={detail.infoLabel}>{label}</Text>
      <Text style={detail.infoValue}>{value}</Text>
    </View>
  );
}

const detail = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  infoLabel: { fontSize: 13, color: Colors.gray, width: 100 },
  infoValue: { fontSize: 13, color: Colors.dark, flex: 1, textAlign: 'right' },
});

export default function ApplicantDetailScreen() {
  const insets = useSafeAreaInsets();
  const { postId, userId, tab } =
    useLocalSearchParams<{ postId: string; userId: string; tab: string }>();

  const [person, setPerson] = useState<PostApplicant | null>(null);
  const [isHearted, setIsHearted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pid = Number(postId);
    const uid = Number(userId);
    const fetcher = tab === 'candidates' ? getContestCandidates : getPostApplicants;
    fetcher(pid)
      .then((list) => {
        const found = list.find((p) => p.userId === uid);
        if (found) setPerson(found);
      })
      .finally(() => setLoading(false));
  }, [postId, userId, tab]);

  if (loading || !person) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="상세 정보" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </View>
    );
  }

  const genderLabel = person.gender === 'MALE' ? '남성' : '여성';

  const handlePropose = () => {
    Alert.alert('제안하기', `${person.nickname}님께 제안을 보낼까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '보내기', onPress: () => Alert.alert('완료', '제안을 보냈어요!') },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="상세 정보" onBack={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* 프로필 상단 */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle} />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nickname}>{person.nickname}</Text>
                <Text style={styles.genderBadge}>{genderLabel}</Text>
                <View style={styles.tempBadge}>
                  <Text style={styles.tempBadgeText}>{person.temperature}°C</Text>
                </View>
              </View>
              <View style={styles.schoolRow}>
                <Text style={styles.schoolText} numberOfLines={1}>{person.school}</Text>
                {person.isSchoolVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedCheck}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.regionText}>📍 {person.regionLabel}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => setIsHearted((v) => !v)}
            >
              <Text style={[styles.heartIcon, isHearted && styles.heartIconActive]}>
                {isHearted ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.proposeBtn} onPress={handlePropose}>
              <Text style={styles.proposeBtnText}>제안하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 어필글 */}
        <View style={styles.appealCard}>
          <Text style={styles.appealLabel}>어필글</Text>
          <Text style={styles.appealTitle}>{person.appealTitle}</Text>
          <Text style={styles.appealContent}>{person.appealContent}</Text>
        </View>

        {/* 참여 정보 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>참여 정보</Text>

          {/* 보유 기술 */}
          <View style={styles.skillSection}>
            <Text style={styles.skillLabel}>보유 기술</Text>
            <View style={styles.skillRow}>
              {person.skills.map((skill) => (
                <View key={skill} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          <InfoRow label="공모전 참여 경험" value={person.experienceLabel} />
          <InfoRow label="참여 강도" value={person.intensityLabel} />
          <InfoRow label="온오프라인/지역" value={person.meetingTypeLabel} />
          <InfoRow label="리더십" value={person.leadershipLabel} />
        </View>

        {/* 경험 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>경험</Text>
          {MOCK_CAREERS.map((career, i) => (
            <View key={i} style={styles.careerItem}>
              <View style={styles.careerTitleRow}>
                <Text style={styles.careerTitle}>{career.title}</Text>
                {career.badge && (
                  <View style={styles.awardBadge}>
                    <Text style={styles.awardBadgeText}>{career.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.careerSub}>{career.sub}</Text>
            </View>
          ))}
        </View>

        {/* 리뷰 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>리뷰</Text>

          <Text style={styles.tempLabel}>티밋 온도</Text>
          <TemperatureBar value={person.temperature} max={40} />

          <View style={styles.reviewDivider} />

          <View style={styles.reviewHeader}>
            <Text style={styles.reviewListTitle}>팀 리뷰</Text>
            <Text style={styles.reviewCount}>{MOCK_REVIEWS.length}개</Text>
          </View>

          {MOCK_REVIEWS.map((r) => (
            <View key={r.id} style={styles.reviewItem}>
              <Text style={styles.reviewContent}>"{r.content}"</Text>
              <Text style={styles.reviewMeta}>{r.contestName} 협업자</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: Colors.grayMedium },
  content: { paddingBottom: 40 },

  // 프로필 카드
  profileCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D9D9D9',
    marginRight: 14,
  },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  nickname: { fontSize: 17, fontWeight: '800', color: Colors.dark },
  genderBadge: { fontSize: 12, color: Colors.gray },
  tempBadge: {
    backgroundColor: Colors.tempBadgeBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tempBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.tempBadgeText },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  schoolText: { fontSize: 13, color: Colors.gray, flexShrink: 1 },
  verifiedBadge: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: { fontSize: 9, fontWeight: '700', color: Colors.white },
  regionText: { fontSize: 13, color: Colors.gray },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: { fontSize: 18, color: Colors.lightGray },
  heartIconActive: { color: Colors.primary },
  proposeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  proposeBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },

  // 어필글
  appealCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  appealLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 6,
  },
  appealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
  },
  appealContent: {
    fontSize: 13,
    color: Colors.gray,
    lineHeight: 20,
  },

  // 공통 섹션 카드
  sectionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },

  // 보유 기술
  skillSection: {
    paddingBottom: 10,
    marginBottom: 2,
  },
  skillLabel: { fontSize: 13, color: Colors.gray, marginBottom: 8 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: {
    backgroundColor: Colors.ogTint,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillTagText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  // 경험
  careerItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  careerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  careerTitle: { fontSize: 14, fontWeight: '600', color: Colors.dark, flex: 1 },
  awardBadge: {
    backgroundColor: Colors.ogTint,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  awardBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  careerSub: { fontSize: 12, color: Colors.grayMedium },

  // 리뷰
  tempLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
    marginBottom: 8,
  },
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
  reviewListTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  reviewCount: { fontSize: 13, color: Colors.grayMedium },
  reviewItem: {
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  reviewContent: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  reviewMeta: { fontSize: 12, color: Colors.grayMedium },
});
