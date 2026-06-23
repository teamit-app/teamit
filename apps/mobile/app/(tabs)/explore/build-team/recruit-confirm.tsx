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
import { useBuildTeamStore } from '../../../../src/store/useBuildTeamStore';
import { useRecruitPostStore } from '../../../../src/store/useRecruitPostStore';
import { dummyContestDetails, dummyParticipationCard } from '../../../../src/data/recruitmentPosts';

const TOTAL_STEPS = 5;
const CURRENT_STEP = 5;

function ConfirmRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={8} activeOpacity={0.7}>
        <Text style={styles.rowEdit}>수정</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RecruitConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const id = Number(contestId);

  const {
    recruitCount,
    requiredSkills,
    genderCondition,
    schoolCondition,
    experienceCondition,
    postTitle,
    postContent,
  } = useBuildTeamStore();

  const addPost = useRecruitPostStore((s) => s.addPost);
  const detail = dummyContestDetails.find((d) => d.contestId === id) ?? dummyContestDetails[0];

  const skillsText = requiredSkills.length > 0 ? requiredSkills.join('  ') : '없음';
  const postText = postContent
    ? `제목 : ${postTitle}\n\n본문 : ${postContent}`
    : `제목 : ${postTitle}`;

  const goBack = () => router.back();

  const handleStart = () => {
    const today = new Date();
    const createdAt = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    const recruitingMembers = Array.from({ length: recruitCount }, (_, i) => ({
      memberId: i + 2,
      name: '모집중',
      isHost: false,
      isRecruiting: true,
    }));

    addPost({
      contestId: id,
      title: postTitle || '팀원 모집합니다',
      teamName: `${postTitle || '팀원 모집'} 팀`,
      createdAt,
      views: 0,
      chatCount: 0,
      likeCount: 0,
      skills: requiredSkills,
      experienceCondition,
      genderCondition,
      schoolCondition,
      meetingType: '혼합',
      location: '',
      intensity: '적당하게 (주 4~7h)',
      currentMembers: 1,
      totalMembers: recruitCount + 1,
      isHearted: false,
      contestName: detail.title,
      contestPeriod: detail.registrationPeriod,
      content: postContent,
      members: [
        { memberId: 1, name: '나', isHost: true, isRecruiting: false },
        ...recruitingMembers,
      ],
      recruiter: {
        name: '나',
        skills: requiredSkills.length > 0 ? requiredSkills : dummyParticipationCard.skills.split(', '),
        experienceCount: dummyParticipationCard.contestExperience,
        intensity: dummyParticipationCard.intensity,
        meetingType: dummyParticipationCard.meetingPreference,
        location: dummyParticipationCard.location,
        teamVibe: dummyParticipationCard.teamVibe,
        leadershipStyle: dummyParticipationCard.leadership,
      },
      comments: [],
    });

    router.push(`/explore/build-team/matching-loading?contestId=${contestId}&returnToConfirm=true` as never);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>모집 조건 확인</Text>
        <Text style={styles.stepText}>{CURRENT_STEP}/{TOTAL_STEPS}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(CURRENT_STEP / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>모집 조건을 최종 확인해요</Text>
        <Text style={styles.pageSubtitle}>아래 내용이 모집글에 반영돼요</Text>

        {/* 통합 카드 */}
        <View style={styles.card}>
          <View style={styles.cardAccentBar} />
          <View style={styles.cardInner}>
            <Text style={styles.previewLabel}>모집 공고 미리보기</Text>
            <Text style={styles.contestTitle}>{detail.title}</Text>
          </View>

          <ConfirmRow
            label="모집 인원"
            value={`${recruitCount}명`}
            onEdit={() => router.push(`/explore/build-team/recruit-count?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="필요 기술"
            value={skillsText}
            onEdit={() => router.push(`/explore/build-team/recruit-skills?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="성별·학교"
            value={`${genderCondition} / ${schoolCondition}`}
            onEdit={() => router.push(`/explore/build-team/recruit-conditions?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="공모전 경험"
            value={experienceCondition}
            onEdit={() => router.push(`/explore/build-team/recruit-conditions?contestId=${contestId}&returnToConfirm=true` as never)}
          />
          <ConfirmRow
            label="모집글"
            value={postText}
            onEdit={() => router.push(`/explore/build-team/recruit-post?contestId=${contestId}&returnToConfirm=true` as never)}
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>모집 시작하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { width: 32 },
  backIcon: { fontSize: 28, color: Colors.dark, lineHeight: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark,
  },
  stepText: {
    width: 32,
    textAlign: 'right',
    fontSize: 13,
    color: Colors.grayMedium,
  },

  // 진행 바
  progressBar: { height: 3, backgroundColor: Colors.lightGray },
  progressFill: { height: 3, backgroundColor: Colors.primary },

  // 본문
  content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: Colors.dark, marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: Colors.gray, marginBottom: 24 },

  // 통합 카드
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  cardAccentBar: { height: 5, backgroundColor: Colors.primary },
  cardInner: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  contestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },

  // 각 row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  rowLeft: { flex: 1 },
  rowLabel: {
    fontSize: 12,
    color: Colors.grayMedium,
    marginBottom: 5,
  },
  rowValue: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 20,
  },
  rowEdit: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    paddingTop: 18,
  },

  // 하단
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
