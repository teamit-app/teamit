import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { RecruitPost } from '../../types/contest';

const normalizeMeetingType = (type: string) => {
  if (type === 'MIXED' || type.includes('혼합')) return '온오프라인혼합';
  if (type === 'OFFLINE' || type.includes('오프라인')) return '오프라인';
  return '온라인';
};

const isOfflineOrMixed = (type: string) =>
  type === 'OFFLINE' || type === 'MIXED' || type.includes('오프라인') || type.includes('혼합');

const genderLabel = (recruiterGender?: string, genderCondition?: string) => {
  const genderText = recruiterGender === 'MALE' ? '남성' : recruiterGender === 'FEMALE' ? '여성' : '';
  const conditionText = genderCondition === 'SAME' ? '동성만' : '성별 무관';
  return [genderText, conditionText].filter(Boolean).join(' · ');
};

interface Props {
  post: RecruitPost;
  onPress: () => void;
  // 여러 공모전이 섞여 나오는 화면(홈 모집글 섹션, 탐색 모집글 탭)에서만 true로 넘겨
  // 어느 공모전의 모집글인지 표시한다. 공모전 상세 화면처럼 컨텍스트가 이미 명확하면 false.
  showContestBadge?: boolean;
}

export function RecruitPostCard({ post, onPress, showContestBadge = false }: Props) {
  const meetingStr = `${normalizeMeetingType(post.meetingType)}${
    post.location && isOfflineOrMixed(post.meetingType) ? `·${post.location}` : ''
  }`;
  // currentMembers는 모집자 본인을 포함한 실제 팀원 수 — 모집자를 제외한 모집된 인원만 표시
  const recruitedCount = Math.max(post.currentMembers - 1, 0);

  const isClosed = post.status === 'CLOSED';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.topRowLeft}>
          <Text style={styles.views}>조회 {post.views}</Text>
          {isClosed && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>마감</Text>
            </View>
          )}
        </View>
        <Text style={styles.date}>{post.createdAt}</Text>
      </View>
      {showContestBadge && !!post.contestTitle && (
        <Text style={styles.contestBadge} numberOfLines={1}>{post.contestTitle}</Text>
      )}
      <Text style={styles.title}>{post.title}</Text>
      <View style={styles.skillRow}>
        {post.skills.slice(0, 3).map((skill) => (
          <View key={skill} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
        {post.skills.length > 3 && (
          <View style={styles.skillTag}>
            <Text style={styles.skillText}>+{post.skills.length - 3}</Text>
          </View>
        )}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{post.experienceCondition}</Text>
        <Text style={styles.metaDot}> · </Text>
        <Text style={styles.metaText}>{meetingStr}</Text>
        <Text style={styles.metaDot}> · </Text>
        <Text style={styles.metaText}>{genderLabel(post.recruiterGender, post.genderCondition)}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.memberCount}>
          현재 모집된 팀원 {recruitedCount}/{post.totalMembers}명
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>💬 {post.chatCount}</Text>
          <Text style={styles.stat}>♥ {post.likeCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  views: { fontSize: 12, color: Colors.grayMedium },
  date: { fontSize: 12, color: Colors.grayMedium },
  closedBadge: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  closedBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.grayMedium },
  contestBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  skillTag: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  skillText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: { fontSize: 12, color: Colors.grayMedium },
  metaDot: { fontSize: 12, color: Colors.grayMedium },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: { fontSize: 12, color: Colors.gray, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { fontSize: 12, color: Colors.grayMedium },
});
