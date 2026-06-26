import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { dummyChatRooms } from '../../../src/data/chatRooms';
import { useReviewStore } from '../../../src/store/useReviewStore';
import { getReceivedReviews, ReceivedReview } from '../../../src/services/reviewService';

// 온도 계산: 25 + (평균 별점 * 3)
function calcTemp(reviews: ReceivedReview[]) {
  if (!reviews.length) return 36.5;
  const avg = reviews.reduce((s, r) => s + r.totalRating, 0) / reviews.length;
  return Math.round((25 + avg * 3) * 10) / 10;
}

// 통계 – 가장 많이 선택된 항목과 비율
function topStat(arr: string[], options: string[]) {
  const top = options.find((v) => arr.includes(v)) ?? arr[0] ?? '—';
  const pct  = arr.length ? Math.round((arr.filter((v) => v === top).length / arr.length) * 100) : 0;
  return { top, pct };
}

// 키워드 빈도 집계
function buildKeywords(reviews: ReceivedReview[]) {
  const map: Record<string, number> = {};
  reviews.forEach((r) => r.keywords.forEach((k) => { map[k] = (map[k] ?? 0) + 1; }));
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([text, count]) => ({ text, count }));
}

// 별점 텍스트 렌더
function starLabel(n: number) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

export default function MyReviewsScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const chatIdNum  = parseInt(chatId ?? '0');

  const MY_USER_ID = 1;
  const chat = dummyChatRooms.find((c) => c.id === chatIdNum);
  const reviewableMembers = (chat?.teamInfo?.members ?? []).filter((m) => m.id !== MY_USER_ID);

  const { getSubmittedReviews } = useReviewStore();
  const submitted = getSubmittedReviews(chatIdNum);
  const allDone   = submitted.length >= reviewableMembers.length;

  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!allDone) { setIsLoading(false); return; }
    getReceivedReviews(chatIdNum)
      .then(setReceivedReviews)
      .catch((e) => console.error('[MyReviews] 리뷰 로드 실패:', e))
      .finally(() => setIsLoading(false));
  }, [chatIdNum, allDone]);

  const temperature = calcTemp(receivedReviews);
  const barWidth    = Math.min((temperature / 40) * 100, 100);

  const speedOptions     = ['1시간 이내', '반나절 이내', '하루 이내', '이틀 이상', '잠수'];
  const deadlineOptions  = ['항상 제때', '대부분 제때', '가끔 늦음', '자주 늦음', '항상 늦음'];
  const intensityOptions = ['적극적 참여', '보통 참여', '소극적 참여', '참여하지 않음'];

  const speedStat     = topStat(receivedReviews.map((r) => r.responseSpeed), speedOptions);
  const deadlineStat  = topStat(receivedReviews.map((r) => r.deadlineCompletion), deadlineOptions);
  const intensityStat = topStat(receivedReviews.map((r) => r.participationIntensity), intensityOptions);

  const keywords = buildKeywords(receivedReviews);

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
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 카드 1: 티밋 온도 ── */}
          <View style={s.card}>
            <View style={s.tempRow}>
              <Text style={s.cardTitle}>티밋 온도</Text>
              <View style={s.tempPill}>
                <Text style={s.tempPillText}>{temperature}°C</Text>
              </View>
            </View>
            <View style={s.barWrap}>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${barWidth}%` as any }]} />
              </View>
              <View style={s.barScale}>
                <Text style={s.barScaleText}>0</Text>
                <Text style={s.barScaleText}>40</Text>
              </View>
            </View>
            <View style={s.divider} />
            <StatRow label="응답 속도" value={`${speedStat.top} (${speedStat.pct}%)`} />
            <StatRow label="마감 완수" value={`${deadlineStat.top} (${deadlineStat.pct}%)`} />
            <StatRow label="참여 강도" value={`${intensityStat.top} (${intensityStat.pct}%)`} />
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

          {/* ── 카드 3: 팀원 리뷰 ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>팀원 리뷰</Text>
            {receivedReviews.map((r, i) => (
              <View key={r.reviewerId}>
                {i > 0 && <View style={s.divider} />}
                <View style={[s.reviewItem, i > 0 && s.reviewItemAfterDivider]}>
                  <View style={s.reviewHeader}>
                    <View style={s.avatarCircle}>
                      <Text style={s.avatarText}>{r.reviewerAvatar ?? '👤'}</Text>
                    </View>
                    <Text style={s.reviewerName}>{r.reviewerName}</Text>
                    <Text style={s.reviewStars}>{starLabel(r.totalRating)}</Text>
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

  // 온도
  tempRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tempPill: {
    backgroundColor: Colors.ogTint,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tempPillText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  barWrap: { gap: 6 },
  barTrack: {
    height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden',
  },
  barFill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  barScale: { flexDirection: 'row', justifyContent: 'space-between' },
  barScaleText: { fontSize: 11, color: Colors.grayMedium },

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
  avatarCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { fontSize: 18 },
  reviewerName:  { fontSize: 14, fontWeight: '700', color: Colors.dark },
  reviewStars:   { fontSize: 13, color: Colors.primary, marginLeft: 2 },
  reviewComment: {
    fontSize: 14, color: Colors.dark, lineHeight: 22,
    paddingLeft: 40,
  },

  ghostBtn: { alignItems: 'center', paddingVertical: 14 },
  ghostBtnText: { fontSize: 14, color: Colors.grayMedium },
});
