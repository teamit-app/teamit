import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useSegments } from 'expo-router';
import { Colors } from '../../constants/colors';
import { PostCommentsSection } from './PostCommentsSection';
import { TeamMember, RecruitPostDetail } from '../../types/contest';

// 모집글 상세 콘텐츠(배너~댓글) — explore/post/[postId].tsx(지원하기 화면)와
// messages/invitation-detail/[invitationId].tsx(초대장 상세)가 공용으로 사용한다.
// 두 화면은 하단 액션바(지원하기 vs 수락/거절)만 다르고 나머지는 완전히 동일해야 하므로
// 절대 각 화면에 따로 복붙하지 말 것.

function MemberAvatar({ member }: { member: TeamMember }) {
  if (member.isRecruiting) {
    return (
      <View style={avatarStyles.wrap}>
        <View style={avatarStyles.recruitingCircle}>
          <Text style={avatarStyles.plus}>+</Text>
        </View>
        <Text style={avatarStyles.name}>모집중</Text>
      </View>
    );
  }
  return (
    <View style={avatarStyles.wrap}>
      <View style={[avatarStyles.circle, member.isHost && avatarStyles.hostCircle]}>
        <Text style={avatarStyles.emoji}>{member.isHost ? '👑' : '👤'}</Text>
      </View>
      <Text style={avatarStyles.name} numberOfLines={1}>{member.name}</Text>
    </View>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <Text style={sectionStyles.heading}>{title}</Text>;
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.infoBlock}>
      <Text style={sectionStyles.infoLabel}>{label}</Text>
      {children}
    </View>
  );
}

interface PostDetailContentProps {
  post: RecruitPostDetail | null;
  postId: number;
  isOwner: boolean;
  onCommentSectionLayout?: (y: number) => void;
  onReplyStart?: () => void;
}

export function PostDetailContent({
  post,
  postId,
  isOwner,
  onCommentSectionLayout,
  onReplyStart,
}: PostDetailContentProps) {
  // 이 컴포넌트는 explore/profile/messages 탭에 각각 alias된 화면에서 공용으로 쓰이므로,
  // 절대경로로 explore를 하드코딩하면 다른 탭에서 볼 때 뒤로가기가 엉뚱한 탭으로 튐
  const segments = useSegments();
  const sourceTab = (segments[1] as string) ?? 'explore';

  return (
    <>
      {/* ── 배너 ── */}
      <View style={styles.banner}>
        <View style={styles.bannerIconCircle}>
          <Text style={styles.bannerIcon}>🏆</Text>
        </View>
        {post?.status === 'CLOSED' && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>마감</Text>
          </View>
        )}
        <Text style={styles.bannerTitle}>{post?.title ?? ''}</Text>
        <Text style={styles.bannerMeta}>
          {post?.createdAt ?? ''} · 조회 {post?.views ?? 0} · 댓글 {post?.chatCount ?? 0}
        </Text>
      </View>

      {/* ── 참가 공모전 (탭하면 공모전 상세로) ── */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={post?.contestId ? 0.7 : 1}
        disabled={!post?.contestId}
        onPress={() => router.push(`/${sourceTab}/contest/${post?.contestId}?source=post` as never)}
      >
        <Text style={styles.cardLabel}>참가 공모전</Text>
        <View style={styles.contestRow}>
          <View style={styles.contestIconCircle}>
            <Text style={styles.contestIcon}>🏆</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contestName}>{post?.contestName ?? ''}</Text>
            <Text style={styles.contestPeriod}>기간 {post?.contestPeriod ?? ''}</Text>
          </View>
          {!!post?.contestId && <Text style={styles.contestChevron}>›</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* ── 현재 팀원 ── */}
      <View style={styles.card}>
        <Text style={styles.memberHeading}>
          현재 팀원 {post?.currentMembers ?? 0}/{(post?.totalMembers ?? 0) + 1}명
        </Text>
        <View style={styles.memberRow}>
          {(post?.members ?? []).map((m) => (
            <MemberAvatar key={m.memberId} member={m} />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── 모집글 ── */}
      <View style={styles.card}>
        <View style={styles.postBox}>
          <Text style={styles.postBoxLabel}>모집글</Text>
          <Text style={styles.postBoxTitle}>{post?.title ?? ''}</Text>
          <Text style={styles.postBoxContent}>{post?.content ?? ''}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── 모집 조건 ── */}
      <View style={styles.card}>
        <SectionHeading title="모집 조건" />

        <InfoBlock label="모집 인원">
          <Text style={sectionStyles.infoValue}>
            {post?.totalMembers ?? 0}명 (현재 {Math.max((post?.currentMembers ?? 0) - 1, 0)}/{post?.totalMembers ?? 0}명 모집 됨)
          </Text>
        </InfoBlock>

        <InfoBlock label="필요 기술">
          <View style={styles.tagRow}>
            {(post?.skills ?? []).map((skill) => (
              <View key={skill} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>
        </InfoBlock>

        <InfoBlock label="성별 · 학교">
          <Text style={sectionStyles.infoValue}>
            {post?.genderConditionLabel || '상관없음'} / {post?.schoolConditionLabel || '상관없음'}
          </Text>
        </InfoBlock>

        <InfoBlock label="공모전 경험 조건">
          <Text style={sectionStyles.infoValue}>{post?.experienceCondition ?? ''}</Text>
        </InfoBlock>
      </View>

      <View style={styles.divider} />

      {/* ── 모집자 정보 ── */}
      <View style={styles.card}>
        <SectionHeading title="모집자 정보" />

        <TouchableOpacity
          style={styles.recruiterProfileCard}
          activeOpacity={0.85}
          onPress={() => router.push(`/${sourceTab}/post/recruiter-profile?postId=${postId}` as never)}
        >
          <View style={styles.recruiterAvatarCircle}>
            <Text style={styles.recruiterAvatarEmoji}>👑</Text>
          </View>
          <Text style={styles.recruiterName}>{post?.recruiter.name ?? ''}</Text>
          {isOwner ? (
            <View style={styles.meBadge}>
              <Text style={styles.meBadgeText}>나</Text>
            </View>
          ) : (
            <View style={styles.chatBtn}>
              <Text style={styles.chatBtnText}>채팅하기</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.tagRow}>
          {(post?.recruiter.skills ?? []).map((skill) => (
            <View key={skill} style={styles.skillTag}>
              <Text style={styles.skillTagText}>{skill}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recruiterInfoList}>
          <InfoBlock label="공모전 참여 경험 및 목적">
            <Text style={sectionStyles.infoValue}>{post?.recruiter.experienceCount ?? ''}</Text>
          </InfoBlock>
          <InfoBlock label="참여 강도">
            <Text style={sectionStyles.infoValue}>{post?.recruiter.intensity ?? ''}</Text>
          </InfoBlock>
          <InfoBlock label="온오프라인선호">
            <Text style={sectionStyles.infoValue}>
              {post?.recruiter.meetingType ?? ''} · {post?.recruiter.location ?? ''}
            </Text>
          </InfoBlock>
          <InfoBlock label="팀 분위기">
            <Text style={sectionStyles.infoValue}>{post?.recruiter.teamVibe ?? ''}</Text>
          </InfoBlock>
          <InfoBlock label="피드백 방식">
            <Text style={sectionStyles.infoValue}>{post?.recruiter.feedbackStyle ?? ''}</Text>
          </InfoBlock>
          <InfoBlock label="리더십">
            <Text style={sectionStyles.infoValue}>{post?.recruiter.leadershipStyle ?? ''}</Text>
          </InfoBlock>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── 댓글 ── */}
      <PostCommentsSection
        postId={postId}
        onSectionLayout={onCommentSectionLayout}
        onReplyStart={onReplyStart}
      />
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  bannerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  bannerIcon: { fontSize: 30 },
  closedBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  closedBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  bannerMeta: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  card: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  divider: { height: 8, backgroundColor: Colors.pageBg },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.grayMedium,
    marginBottom: 12,
  },

  contestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contestIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contestIcon: { fontSize: 20 },
  contestName: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 3 },
  contestPeriod: { fontSize: 12, color: Colors.grayMedium },
  contestChevron: { fontSize: 20, color: Colors.grayMedium },

  memberHeading: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 16 },
  memberRow: { flexDirection: 'row', gap: 12 },

  postBox: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  postBoxLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  postBoxTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  postBoxContent: { fontSize: 14, color: Colors.dark, lineHeight: 22 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  skillTagText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  recruiterProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  recruiterAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recruiterAvatarEmoji: { fontSize: 22 },
  recruiterName: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.dark },
  chatBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  meBadge: {
    backgroundColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  meBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  recruiterInfoList: { marginTop: 16 },
});

const avatarStyles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 56 },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  hostCircle: { backgroundColor: Colors.ogTint, borderWidth: 2, borderColor: Colors.primary },
  recruitingCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emoji: { fontSize: 24 },
  plus: { fontSize: 22, color: Colors.grayLight, fontWeight: '300' },
  name: { fontSize: 11, color: Colors.gray, textAlign: 'center' },
});

const sectionStyles = StyleSheet.create({
  heading: { fontSize: 17, fontWeight: '700', color: Colors.dark, marginBottom: 16 },
  infoBlock: { marginBottom: 14 },
  infoLabel: { fontSize: 12, color: Colors.grayMedium, marginBottom: 5 },
  infoValue: { fontSize: 14, color: Colors.dark, lineHeight: 21 },
});
