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
import { getPostApplicants, getContestCandidates } from '../../../src/services/mypageService';
import { PostApplicant } from '../../../src/types/mypage';

type Tab = 'applicants' | 'candidates';

function ApplicantCard({
  person,
  isHearted,
  onToggleHeart,
  onPress,
}: {
  person: PostApplicant;
  isHearted: boolean;
  onToggleHeart: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.75}>
      <View style={card.topRow}>
        <View style={card.tempBadge}>
          <Text style={card.tempText}>{person.temperature}°C</Text>
        </View>
        <TouchableOpacity onPress={onToggleHeart} hitSlop={10}>
          <Text style={[card.heartIcon, isHearted && card.heartIconActive]}>
            {isHearted ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={card.bodyRow}>
        <View style={card.avatar}>
          <Text style={card.avatarEmoji}>🧑‍💻</Text>
        </View>
        <View style={card.info}>
          <View style={card.nameRow}>
            <Text style={card.name}>{person.nickname}</Text>
            <Text style={card.gender}>{person.gender === 'MALE' ? '남성' : '여성'}</Text>
          </View>
          <View style={card.schoolRow}>
            <Text style={card.school} numberOfLines={1}>{person.school}</Text>
            {person.isSchoolVerified && (
              <View style={card.verifiedBadge}>
                <Text style={card.verifiedCheck}>✓</Text>
              </View>
            )}
          </View>
          <Text style={card.intro} numberOfLines={1}>{person.introText}</Text>
        </View>
      </View>

      <View style={card.skillRow}>
        {person.skills.map((skill) => (
          <View key={skill} style={card.skillTag}>
            <Text style={card.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={card.pillRow}>
        {[
          person.meetingTypeLabel,
          person.experienceLabel,
          person.intensityLabel,
          person.leadershipLabel,
        ].map((label, i) => (
          <View key={i} style={card.pill}>
            <Text style={card.pillText}>{label}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tempBadge: {
    backgroundColor: Colors.tempBadgeBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tempText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.tempBadgeText,
  },
  heartIcon: {
    fontSize: 20,
    color: Colors.lightGray,
  },
  heartIconActive: {
    color: Colors.primary,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffedde',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  gender: { fontSize: 9, color: Colors.primary, fontWeight: '600' },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  school: { fontSize: 12, color: Colors.grayMedium, flexShrink: 1 },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: { fontSize: 8, fontWeight: '700', color: Colors.white },
  intro: { fontSize: 10, color: Colors.gray, marginTop: 3 },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  skillTag: {
    backgroundColor: Colors.pageBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  skillText: { fontSize: 12, color: Colors.dark },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: '#ffedde',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillText: { fontSize: 11, color: '#ff6a1c', fontWeight: '500' },
});

export default function ApplicantsScreen() {
  const insets = useSafeAreaInsets();
  const { postId, postTitle, contestTitle } =
    useLocalSearchParams<{ postId: string; postTitle: string; contestTitle: string }>();

  const [tab, setTab] = useState<Tab>('applicants');
  const [applicants, setApplicants] = useState<PostApplicant[]>([]);
  const [candidates, setCandidates] = useState<PostApplicant[]>([]);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pid = Number(postId);
    Promise.all([getPostApplicants(pid), getContestCandidates(pid)])
      .then(([apps, cands]) => {
        setApplicants(apps);
        setCandidates(cands);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const toggleHeart = (userId: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const navigateToDetail = (person: PostApplicant) => {
    router.push({
      pathname: '/(tabs)/profile/applicant-detail',
      params: {
        postId: String(postId),
        userId: String(person.userId),
        tab,
      },
    });
  };

  const currentList = tab === 'applicants' ? applicants : candidates;
  const subtitleLabel = tab === 'applicants' ? '모집글 지원자' : '매칭된 팀원 후보';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="지원자 및 후보자" onBack={() => router.back()} />

      {/* 모집글 정보 칩 */}
      <View style={styles.postChipWrap}>
        <View style={styles.postChip}>
          <Text style={styles.postChipContest}>{contestTitle}</Text>
          <Text style={styles.postChipTitle} numberOfLines={1}>{postTitle}</Text>
        </View>
      </View>

      {/* 탭 세그먼트 */}
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {(['applicants', 'candidates'] as Tab[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.segTab, tab === key && styles.segTabActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segTabText, tab === key && styles.segTabTextActive]}>
                {key === 'applicants' ? '지원한 사람' : '해당 공모전 후보'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {/* 섹션 소제목 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{subtitleLabel}</Text>
            <Text style={styles.sectionHint}>카드를 클릭하면 상세정보를 확인할 수 있습니다</Text>
          </View>

          {currentList.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>{tab === 'applicants' ? '📋' : '👥'}</Text>
              <Text style={styles.emptyText}>
                {tab === 'applicants' ? '아직 지원자가 없어요' : '후보로 등록된 인재가 없어요'}
              </Text>
            </View>
          ) : (
            currentList.map((person) => (
              <ApplicantCard
                key={person.userId}
                person={person}
                isHearted={likedIds.has(person.userId)}
                onToggleHeart={() => toggleHeart(person.userId)}
                onPress={() => navigateToDetail(person)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontSize: 14, color: Colors.grayMedium },

  postChipWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  postChip: {
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postChipContest: { fontSize: 11, color: Colors.primary, marginBottom: 2 },
  postChipTitle: { fontSize: 13, fontWeight: '600', color: Colors.dark },

  segmentWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    borderRadius: 999,
    padding: 4,
  },
  segTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  segTabActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segTabText: { fontSize: 14, fontWeight: '600', color: Colors.gray },
  segTabTextActive: { color: Colors.primary },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayMedium,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 11,
    color: Colors.grayLight,
  },

  emptyBox: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.grayMedium },
});
