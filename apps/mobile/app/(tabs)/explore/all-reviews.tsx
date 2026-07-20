import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { ScreenHeader } from '../../../src/components/common/ScreenHeader';
import { StarRating } from '../../../src/components/common/StarRating';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useMyReceivedReviews } from '../../../src/hooks/useMyReceivedReviews';
import { reviewerStarRating } from '../../../src/utils/reviewStats';
import { getUserDetail } from '../../../src/services/talentService';

// 리뷰어 정보는 절대 포함하지 않는다(익명 정책)
interface ReviewItem {
  content: string;
  rating: number;
}

// 내 리뷰(userId 없음, 전체 집계) / 다른 유저 리뷰(userId 있음, 서버 집계)를
// 최신순으로 쭉 보여주는 "팀원 리뷰 전체보기" 화면 — 마이페이지 "리뷰 확인" 진입점
export default function AllReviewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const isOther = !!userId;

  const MY_USER_ID = useAuthStore((s) => s.currentUserId);
  const { reviews: myReviews, averageRating: myAverageRating, isLoading: myLoading } =
    useMyReceivedReviews(isOther ? null : MY_USER_ID);

  const [otherLoading, setOtherLoading] = useState(isOther);
  const [otherReviews, setOtherReviews] = useState<ReviewItem[]>([]);
  const [otherAverageRating, setOtherAverageRating] = useState(0);

  useEffect(() => {
    if (!isOther) return;
    getUserDetail(Number(userId))
      .then((detail) => {
        setOtherReviews(detail.teamReviews.map((r) => ({ content: r.content, rating: r.rating })));
        setOtherAverageRating(detail.averageRating);
      })
      .catch((e) => console.error('[AllReviews] 리뷰 로드 실패:', e))
      .finally(() => setOtherLoading(false));
  }, [isOther, userId]);

  const isLoading = isOther ? otherLoading : myLoading;
  const averageRating = isOther ? otherAverageRating : myAverageRating;

  const reviews: ReviewItem[] = isOther
    ? otherReviews // 서버에서 이미 최신순 정렬됨
    : [...myReviews]
        .filter((r) => r.comment)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .map((r) => ({ content: r.comment!, rating: reviewerStarRating(r) }));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScreenHeader title="팀원 리뷰" onBack={() => router.back()} />

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>아직 받은 리뷰가 없어요</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.averageCard}>
            <Text style={s.averageLabel}>받은 별점 평균</Text>
            <View style={s.averageRow}>
              <Text style={s.averageScore}>{averageRating.toFixed(1)}</Text>
              <Text style={s.averageMax}> / 5</Text>
            </View>
            <StarRating value={averageRating} size={18} />
          </View>

          {reviews.map((r, i) => (
            <View key={i} style={s.card}>
              <View style={s.reviewerRow}>
                <StarRating value={r.rating} size={14} />
              </View>
              <Text style={s.reviewContent}>"{r.content}"</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.grayMedium },

  scroll: { padding: 16 },

  averageCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 6,
  },
  averageLabel: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  averageRow: { flexDirection: 'row', alignItems: 'flex-end' },
  averageScore: { fontSize: 32, fontWeight: '700', color: Colors.primary, lineHeight: 36 },
  averageMax: { fontSize: 14, color: Colors.grayMedium, marginBottom: 4 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 8,
  },
  reviewerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewContent: { fontSize: 14, color: Colors.dark, lineHeight: 22 },
});
