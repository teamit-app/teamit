import React, { useState } from 'react';
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
import { dummyCandidates } from '../../../../src/data/candidates';
import { Candidate } from '../../../../src/types/team';
import { useInvitationStore } from '../../../../src/store/useInvitationStore';

// mock: 후보자 id → 1:1 직접 채팅방 id 매핑
const CANDIDATE_CHAT_MAP: Record<number, number> = {
  1: 5,
  2: 6,
  3: 3,
  4: 4,
};

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
      {/* Row 1 : 온도+아바타 | 이름·학교·어필제목 | 체크 원 */}
      <View style={styles.profileRow}>
        {/* 온도 + 아바타 */}
        <View style={styles.avatarCol}>
          <Text style={styles.tempText}>{candidate.temperature}°C</Text>
          <View style={[styles.avatar, selected && styles.avatarSelected]}>
            <Text style={styles.avatarEmoji}>🐱</Text>
          </View>
        </View>

        {/* 이름 · 학교 · 어필글 제목 */}
        <View style={styles.profileInfo}>
          <Text style={styles.nameText}>
            {candidate.name}
            <Text style={styles.genderText}> {candidate.gender}</Text>
          </Text>
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

      {/* Row 2 : 기술 스택(회색 pill, 좌) + 지역(주황 pill, 우) */}
      <View style={styles.tagsRow}>
        <View style={styles.skillGroup}>
          {candidate.skills.map((sk) => (
            <GrayPill key={sk} label={sk} />
          ))}
        </View>
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
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { addInvitationMessages } = useInvitationStore();

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

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

        {dummyCandidates.map((c) => (
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
      </ScrollView>

      {/* ─ 하단 버튼 ─ */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.inviteBtn, selectedIds.length === 0 && styles.inviteBtnDisabled]}
          onPress={selectedIds.length > 0 ? () => {
            const now = new Date().toISOString();
            selectedIds.forEach((cid, i) => {
              const candidate = dummyCandidates.find((c) => c.id === cid);
              const chatId = CANDIDATE_CHAT_MAP[cid];
              if (!candidate || !chatId) return;
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
                    postId: 1,
                    invitationId: 1,
                  },
                },
              ]);
            });
            router.replace('/(tabs)/messages' as never);
          } : undefined}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  sectionHint: {
    fontSize: 11,
    color: Colors.primary,
  },

  /* 카드 */
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
  },
  cardSelected: { borderColor: Colors.primary, borderWidth: 2 },

  /* Row 1 - 프로필 */
  profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },

  avatarCol: { alignItems: 'center', gap: 2 },
  tempText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: Colors.ogTint },
  avatarEmoji: { fontSize: 24 },

  profileInfo: { flex: 1, gap: 3 },
  nameText: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  genderText: { fontSize: 12, fontWeight: '400', color: Colors.grayMedium },

  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  schoolText: { fontSize: 12, color: Colors.gray },
  verifiedDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.primary,   // ← 주황색
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheckText: { fontSize: 8, color: '#fff', fontWeight: '900' },

  introText: { fontSize: 13, color: Colors.dark, fontWeight: '500' },

  /* 체크 원 */
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMarkOn: { fontSize: 12, color: '#fff', fontWeight: '700' },
  checkMarkOff: { fontSize: 12, color: Colors.grayLight, fontWeight: '700' },

  /* Row 2 - 스킬(회색 pill) + 지역(주황 pill) */
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillGroup: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  /* Row 3 - 주황 pill 정보 + 더보기 */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  infoPills: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' },
  moreBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  moreBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

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
