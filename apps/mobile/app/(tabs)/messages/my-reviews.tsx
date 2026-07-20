import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { useReviewStore } from '../../../src/store/useReviewStore';
import { getMyReceivedReviews, AnonymousReview } from '../../../src/services/reviewService';
import { TeamMemberStatus } from '../../../src/types/message';
import { getChat } from '../../../src/services/messageService';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { buildReviewStats, buildReviewKeywords } from '../../../src/utils/reviewStats';
import { StarRating } from '../../../src/components/common/StarRating';

export default function MyReviewsScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const chatIdNum  = parseInt(chatId ?? '0');

  const MY_USER_ID = useAuthStore((state) => state.currentUserId) ?? 0;
  const [reviewableMembers, setReviewableMembers] = useState<TeamMemberStatus[]>([]);

  useEffect(() => {
    getChat(chatIdNum).then((chat) => {
      setReviewableMembers((chat?.teamInfo?.members ?? []).filter((m) => m.filled && m.id !== MY_USER_ID));
    }).catch(() => {});
  }, [chatIdNum, MY_USER_ID]);

  const { loadSubmitted, getSubmittedReceiverIds } = useReviewStore();
  useEffect(() => { loadSubmitted(chatIdNum); }, [chatIdNum]);
  const submitted = getSubmittedReceiverIds(chatIdNum);
  const allDone   = reviewableMembers.length > 0 && submitted.length >= reviewableMembers.length;

  // 여기서 보여주는 내용은 이 채팅방 한정이 아니라 내가 받은 리뷰 전체 집계다(마이페이지
  // "리뷰 확인"과 동일한 데이터). 잠금 해제 조건만 이 채팅방 팀원 전원 리뷰 완료 여부로 판단한다
  const [averageRating, setAverageRating] = useState(0);
  const [receivedReviews, setReceivedReviews] = useState<AnonymousReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!allDone) { setIsLoading(false); return; }
    getMyReceivedReviews()
      .then((data) => {
        setAverageRating(data.averageRating);
        setReceivedReviews(data.reviews);
      })
      .catch((e) => console.error('[MyReviews] 리뷰 로드 실패:', e))
      .finally(() => setIsLoading(false));
  }, [allDone]);

  const reviewStats = buildReviewStats(receivedReviews);
  const keywords = buildReviewKeywords(receivedReviews);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>내가 받은 리뷰</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 로딩 */}
      {isLoading ? (
        <View style={s.lockedWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !allDone ? (
        <View style={s.lockedWrap}>
          <Text style={s.lockIcon}>🔒</Text>
          <Text style={s.lockTitle}>아직 받은 리뷰를 볼 수 없어요</Text>
          <Text style={s.lockDesc}>
            모든 팀원({reviewableMembers.length}명)에게 리뷰를 작성해야{'\n'}
            내가 받은 리뷰를 확인할 수 있어요.
          </Text>
          <Text style={s.lockProgress}>
            현재 {submitted.length} / {reviewableMembers.length}명 완료
          </Text>
          <TouchableOpacity
            style={s.lockBtn}
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/messages/review-write' as never,
                params: { chatId },
              })
            }
          >
            <Text style={s.lockBtnText}>리뷰 작성하러 가기</Text>
          </TouchableOpacity>
        </View>
      ) : receivedReviews.length === 0 ? (
        <View style={s.lockedWrap}>
          <Text style={s.lockIcon}>📭</Text>
          <Text style={s.lockTitle}>아직 받은 리뷰가 없어요</Text>
          <Text style={s.lockDesc}>
            팀원들이 리뷰를 작성하면{'\n'}
            여기에서 확인할 수 있어요.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 카드 1: 받은 별점 평균 ── */}
          <View style={s.card}>
            <View style={s.tempRow}>
              <Text style={s.cardTitle}>받은 별점 평균</Text>
              <View style={s.tempPill}>
                <Text style={s.tempPillText}>{averageRating.toFixed(1)} / 5</Text>
              </View>
            </View>
            <View style={s.starRow}>
              <StarRating value={averageRating} size={20} />
            </View>
            <View style={s.divider} />
            {reviewStats
              .filter((row) => row.label !== '총평')
              .map((row) => (
                <StatRow key={row.label} label={row.label} value={row.value} />
              ))}
          </View>

          {/* ── 카드 2: 키워드 ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>팀원들이 선택한 키워드</Text>
            <View style={s.kwWrap}>
              {keywords.map((kw) => (
                <View key={kw.text} style={s.kwPill}>
                  <Text style={s.kwText}>{kw.text}</Text>
                  <View style={s.kwBadge}>
                    <Text style={s.kwBadgeText}>{kw.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── 카드 3: 팀원 리뷰 (익명) ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>팀원 리뷰</Text>
            {receivedReviews.map((r, i) => (
              <View key={i}>
                {i > 0 && <View style={s.divider} />}
                <View style={[s.reviewItem, i > 0 && s.reviewItemAfterDivider]}>
                  <View style={s.reviewHeader}>
                    <StarRating value={r.totalRating} size={13} />
                  </View>
                  {r.comment ? (
                    <Text style={s.reviewComment}>"{r.comment}"</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          {/* 채팅방으로 */}
          <TouchableOpacity
            style={s.ghostBtn}
            activeOpacity={0.7}
            onPress={() =>
              router.replace({
                pathname: '/(tabs)/messages/[chatId]' as never,
                params: { chatId },
              })
            }
          >
            <Text style={s.ghostBtnText}>채팅방으로 돌아가기</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
      </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statRow}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn:     { width: 36, alignItems: 'flex-start' },
  backIcon:    { fontSize: 26, color: Colors.dark, lineHeight: 30 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark },

  scroll: { padding: 16, gap: 12 },

  // 잠금 화면
  lockedWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  lockIcon:     { fontSize: 56, marginBottom: 4 },
  lockTitle:    { fontSize: 18, fontWeight: '700', color: Colors.dark, textAlign: 'center' },
  lockDesc:     { fontSize: 14, color: Colors.grayMedium, textAlign: 'center', lineHeight: 22 },
  lockProgress: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  lockBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  lockBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  // 카드
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark },

  // 평균 별점
  tempRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tempPill: {
    backgroundColor: Colors.ogTint,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tempPillText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  starRow: {},

  divider: { height: 1, backgroundColor: '#F0F0F0' },

  statRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 13, color: Colors.grayMedium },
  statValue: { fontSize: 13, fontWeight: '600', color: Colors.dark },

  // 키워드
  kwWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kwPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.white,
  },
  kwText:  { fontSize: 13, color: Colors.primary },
  kwBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  kwBadgeText: { fontSize: 11, color: Colors.white, fontWeight: '700' },

  // 리뷰 아이템
  reviewItem:            { gap: 6 },
  reviewItemAfterDivider:{ marginTop: 14 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewComment: {
    fontSize: 14, color: Colors.dark, lineHeight: 22,
  },

  ghostBtn: { alignItems: 'center', paddingVertical: 14 },
  ghostBtnText: { fontSize: 14, color: Colors.grayMedium },
});
