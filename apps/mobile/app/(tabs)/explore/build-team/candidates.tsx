import React, { useState, useEffect } from 'react';
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
import { Candidate } from '../../../../src/types/team';
import { PostApplicant } from '../../../../src/types/mypage';
import { useInvitationStore } from '../../../../src/store/useInvitationStore';
import { sendInvitation } from '../../../../src/services/invitationService';
import { getContestCandidates, getAllContestCandidates } from '../../../../src/services/mypageService';

const IS_MOCK = process.env.EXPO_PUBLIC_API_MODE === 'mock';

function adaptCandidate(a: PostApplicant): Candidate {
  return {
    id: a.userId,
    name: a.nickname,
    gender: a.gender === 'FEMALE' ? '여성' : '남성',
    school: a.school,
    location: a.regionLabel,
    intro: a.appealTitle,
    introContent: a.appealContent,
    skills: a.skills,
    averageRating: a.averageRating,
    matchScore: 0,
    intensity: a.intensityLabel,
    meetingType: a.meetingTypeLabel,
    teamVibe: '',
    feedbackStyle: '',
    leadershipStyle: a.leadershipLabel,
    contestCount: 0,
    contestExperience: a.experienceLabel,
    contestExperienceDetail: a.experienceLabel,
    contestHistory: [],
    certifications: [],
    isVerified: a.isSchoolVerified,
    reviewStats: { totalRating: '', responseSpeed: '', deadlineCompletion: '', participationIntensity: '' },
    reviewKeywords: [],
    teamReviews: [],
    reviews: [],
  };
}

const leadershipSymbol = (style: string) => {
  if (style.includes('가능') || style.includes('리더')) return '○';
  if (style.includes('팔로워')) return '×';
  return '△';
};

/* ─── 공통 Pill 컴포넌트 ─── */
function GrayPill({ label }: { label: string }) {
  return (
    <View style={pill.gray}>
      <Text style={pill.grayText}>{label}</Text>
    </View>
  );
}
function OrangePill({ label }: { label: string }) {
  return (
    <View style={pill.orange}>
      <Text style={pill.orangeText}>{label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  gray: {
    backgroundColor: '#EBEBEB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  grayText: { fontSize: 12, color: Colors.dark },
  orange: {
    backgroundColor: Colors.ogTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orangeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});

/* ─── 후보 카드 ─── */
function CandidateCard({
  candidate,
  selected,
  onSelect,
  onDetail,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
  onDetail: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onDetail}
      activeOpacity={0.85}
    >
      {/* Row 1 : 아바타(온도 pill 오버레이) | 이름·학교·어필제목 | 체크 원 */}
      <View style={styles.profileRow}>
        {/* 아바타 + 온도 pill 오버레이 */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🧑‍💻</Text>
          </View>
          <View style={styles.tempPillWrap}>
            <View style={styles.tempPill}>
              <Text style={styles.tempText}>★ {candidate.averageRating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* 이름 · 학교 · 어필글 제목 */}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{candidate.name}</Text>
            <Text style={styles.genderText}> {candidate.gender}</Text>
          </View>
          <View style={styles.schoolRow}>
            <Text style={styles.schoolText}>{candidate.school}</Text>
            {candidate.isVerified && (
              <View style={styles.verifiedDot}>
                <Text style={styles.verifiedCheckText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.introText} numberOfLines={1}>
            {candidate.intro}
          </Text>
        </View>

        {/* 선택 체크 원 */}
        <TouchableOpacity
          style={[styles.checkCircle, selected && styles.checkCircleOn]}
          onPress={onSelect}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Text style={selected ? styles.checkMarkOn : styles.checkMarkOff}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* Row 2 : 회색 pill(기술) + 주황 pill(지역) — 같은 줄에 좌정렬 */}
      <View style={styles.tagsRow}>
        {candidate.skills.map((sk) => (
          <GrayPill key={sk} label={sk} />
        ))}
        <OrangePill label={`${candidate.meetingType}·${candidate.location}`} />
      </View>

      {/* Row 3 : 주황 pill 정보들 */}
      <View style={styles.infoPills}>
        <OrangePill label={`공모전 경험 ${candidate.contestExperience}`} />
        <OrangePill label={candidate.intensity} />
        <OrangePill label={`리더 역할 ${leadershipSymbol(candidate.leadershipStyle)}`} />
      </View>
    </TouchableOpacity>
  );
}

/* ─── 메인 화면 ─── */
export default function CandidatesScreen() {
  const insets = useSafeAreaInsets();
  const { contestId, postId } = useLocalSearchParams<{ contestId: string; postId?: string }>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allLoadingMore, setAllLoadingMore] = useState(false);
  const [allPage, setAllPage] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(0);
  const { addInvitationMessages } = useInvitationStore();

  useEffect(() => {
    if (IS_MOCK) {
      import('../../../../src/data/candidates').then(({ dummyCandidates }) => {
        setCandidates(dummyCandidates);
        setLoading(false);
        setAllCandidates(dummyCandidates);
        setAllLoading(false);
      });
    } else {
      const pid = Number(postId);
      if (pid) {
        getContestCandidates(pid)
          .then((applicants) => setCandidates(applicants.map(adaptCandidate)))
          .catch(console.error)
          .finally(() => setLoading(false));
        getAllContestCandidates(pid, 0)
          .then((res) => {
            setAllCandidates(res.content.map(adaptCandidate));
            setAllPage(res.currentPage);
            setAllTotalPages(res.totalPages);
          })
          .catch(console.error)
          .finally(() => setAllLoading(false));
      } else {
        setLoading(false);
        setAllLoading(false);
      }
    }
  }, [postId]);

  const loadMoreAllCandidates = () => {
    const pid = Number(postId);
    if (!pid || allLoadingMore || allPage + 1 >= allTotalPages) return;
    setAllLoadingMore(true);
    getAllContestCandidates(pid, allPage + 1)
      .then((res) => {
        setAllCandidates((prev) => [...prev, ...res.content.map(adaptCandidate)]);
        setAllPage(res.currentPage);
        setAllTotalPages(res.totalPages);
      })
      .catch(console.error)
      .finally(() => setAllLoadingMore(false));
  };

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const resolvedPostId = Number(postId) || 1;

  const handleSendInvitations = async () => {
    if (selectedIds.length === 0 || isSending) return;
    setIsSending(true);
    try {
      const now = new Date().toISOString();
      await Promise.all(
        selectedIds.map(async (cid, i) => {
          const candidate = candidates.find((c) => c.id === cid) ?? allCandidates.find((c) => c.id === cid);
          if (!candidate) return;
          const { chatRoomId: chatId } = await sendInvitation(resolvedPostId, candidate.id);
          // 실서버 모드에선 초대 발송 시 백엔드(ChatService.sendInvitationMessages)가
          // 인사말 + 초대장 카드 메시지를 이미 채팅방에 저장해서, 채팅방을 열면 getChat()으로
          // 그대로 내려온다. 여기서 또 로컬에 추가하면 메시지가 두 번 보이므로 mock 전용으로만 추가한다.
          if (!IS_MOCK) return;
          const baseId = Date.now() + i * 100;
          addInvitationMessages(chatId, [
            {
              id: baseId,
              senderId: 1,
              senderName: '나',
              senderAvatar: '👨‍💻',
              content: `티밋님이 ${candidate.name}님을 팀에 초대하셨어요! 🎉`,
              createdAt: now,
              isSent: true,
            },
            {
              id: baseId + 1,
              senderId: 1,
              senderName: '나',
              senderAvatar: '👨‍💻',
              content: '',
              createdAt: now,
              isSent: true,
              invitationCard: {
                title: '팀원을 모집합니다',
                currentMembers: 3,
                totalMembers: 5,
                contestName: contestId ? `공모전 #${contestId}` : '공모전',
                senderName: '나',
                postId: resolvedPostId,
                invitationId: 1,
              },
            },
          ]);
        })
      );
      router.replace('/(tabs)/messages?initialTab=chats' as never);
    } catch (e) {
      console.error('[Candidates] 초대장 전송 실패:', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ─ 상단 배너 ─ */}
      <View style={styles.banner}>
        <View style={styles.bannerIconWrap}>
          <Text style={styles.bannerIconText}>✓</Text>
        </View>
        <Text style={styles.bannerTitle}>
          팀원 모집글과 팀 채팅방이{'\n'}생성되었어요!
        </Text>
        <Text style={styles.bannerSubtitle}>
          만들어진 팀 채팅방에 팀원을 초대할 수 있어요
        </Text>
      </View>

      {/* ─ 후보 목록 ─ */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>매칭된 팀원 후보</Text>
          <Text style={styles.sectionHint}>카드를 클릭하면 상세정보를 확인할 수 있습니다</Text>
        </View>

        {loading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>매칭 중이에요...</Text>
          </View>
        ) : candidates.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>조건에 맞는 후보가 없어요</Text>
            <Text style={styles.emptyDesc}>
              공모전 후보로 등록된 팀원이 없거나{'\n'}모집 조건과 맞는 사람이 아직 없어요
            </Text>
          </View>
        ) : (
          candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              selected={selectedIds.includes(c.id)}
              onSelect={() => toggleSelect(c.id)}
              onDetail={() =>
                router.push(`/explore/build-team/candidate/${c.id}?contestId=${contestId}` as never)
              }
            />
          ))
        )}

        {/* ─ 전체 후보 ─ 매칭 조건과 무관하게 이 공모전에 등록된 모든 후보.
            초반엔 매칭된 후보가 너무 적을 수 있어 아래에 함께 보여준다 */}
        <View style={[styles.sectionTitleRow, styles.allSectionTitleRow]}>
          <Text style={styles.sectionTitle}>전체 후보</Text>
          <Text style={styles.sectionHint}>이 공모전에 후보로 등록한 모든 사람이에요</Text>
        </View>

        {allLoading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>불러오는 중이에요...</Text>
          </View>
        ) : allCandidates.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>후보로 등록한 사람이 없어요</Text>
          </View>
        ) : (
          <>
            {allCandidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                selected={selectedIds.includes(c.id)}
                onSelect={() => toggleSelect(c.id)}
                onDetail={() =>
                  router.push(`/explore/build-team/candidate/${c.id}?contestId=${contestId}` as never)
                }
              />
            ))}
            {allPage + 1 < allTotalPages && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={loadMoreAllCandidates}
                disabled={allLoadingMore}
                activeOpacity={0.7}
              >
                <Text style={styles.loadMoreBtnText}>
                  {allLoadingMore ? '불러오는 중...' : '더보기'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* ─ 하단 버튼 ─ */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.inviteBtn, (selectedIds.length === 0 || isSending) && styles.inviteBtnDisabled]}
          onPress={handleSendInvitations}
          activeOpacity={selectedIds.length > 0 ? 0.85 : 1}
        >
          <Text style={[styles.inviteBtnText, selectedIds.length === 0 && styles.inviteBtnTextDisabled]}>
            💌 선택한 후보에게 팀 초대장 보내기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },

  /* 배너 */
  banner: {
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  bannerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bannerIconText: { fontSize: 34, color: '#fff', fontWeight: '900' },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },
  bannerSubtitle: { fontSize: 13, color: Colors.gray, textAlign: 'center' },

  /* 리스트 */
  listContent: { padding: 16, gap: 10 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  allSectionTitleRow: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  loadMoreBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  sectionHint: {
    fontSize: 11,
    color: Colors.primary,
  },

  /* 빈 상태 */
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  emptyDesc: { fontSize: 13, color: Colors.gray, textAlign: 'center', lineHeight: 20 },
  emptyText: { fontSize: 14, color: Colors.grayMedium },

  /* 카드 */
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 10,
  },
  cardSelected: { borderColor: Colors.primary, borderWidth: 2 },

  /* Row 1 - 프로필 */
  profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },

  /* 아바타 + 온도 pill 오버레이 */
  avatarWrap: {
    position: 'relative',
    width: 56,
    height: 56,
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.ogTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  tempPillWrap: {
    position: 'absolute',
    top: -9,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  tempPill: {
    backgroundColor: '#fef3c7',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tempText: { fontSize: 11, fontWeight: '700', color: '#947340' },

  profileInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  nameText: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  genderText: { fontSize: 12, fontWeight: '400', color: Colors.grayMedium },

  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  schoolText: { fontSize: 12, color: Colors.gray },
  verifiedDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheckText: { fontSize: 8, color: '#fff', fontWeight: '900' },

  introText: { fontSize: 13, color: Colors.dark, fontWeight: '500' },

  /* 체크 원 */
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMarkOn: { fontSize: 14, color: '#fff', fontWeight: '700' },
  checkMarkOff: { fontSize: 14, color: Colors.grayLight, fontWeight: '700' },

  /* Row 2 - 회색 pill + 주황 pill 모두 좌정렬 */
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  /* Row 3 - 주황 pill 정보 */
  infoPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  /* 하단 */
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  inviteBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  inviteBtnDisabled: { backgroundColor: Colors.lightGray },
  inviteBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  inviteBtnTextDisabled: { color: Colors.grayMedium },
});
