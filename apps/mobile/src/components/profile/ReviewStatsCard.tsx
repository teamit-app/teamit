import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { StarRating } from '../common/StarRating';
import { ReviewStatRow, ReviewKeywordChip, ReviewCommentItem } from '../../utils/reviewStats';

// talent/[userId].tsx 상세정보 화면의 "리뷰" 카드와 동일한 디자인을 공유하는 컴포넌트
// (내 정보 탭에서도 같은 형태로 리뷰 통계를 보여주기 위해 분리)

export type { ReviewStatRow, ReviewKeywordChip, ReviewCommentItem };

interface Props {
  averageRating: number; // 0~5
  stats: ReviewStatRow[];
  keywords?: ReviewKeywordChip[];
  reviewCount?: number;
  comments?: ReviewCommentItem[]; // 제공되면 리뷰 헤더 아래에 실제 코멘트를 미리보기로 표시
  onPressReviews?: () => void;
  emptyText?: string;
}

export function ReviewStatsCard({
  averageRating,
  stats,
  keywords = [],
  reviewCount = 0,
  comments = [],
  onPressReviews,
  emptyText,
}: Props) {
  const hasReviews = stats.length > 0;

  return (
    <View style={s.card}>
      <Text style={s.tempCardLabel}>받은 별점 평균</Text>
      <View style={s.tempScoreRow}>
        <Text style={s.tempScore}>{averageRating.toFixed(1)}</Text>
        <Text style={s.tempScoreMax}> / 5</Text>
      </View>
      <View style={s.starRow}>
        <StarRating value={averageRating} size={20} />
      </View>

      {hasReviews ? (
        <>
          <View style={s.statDivider} />
          {stats.map((row) => (
            <View key={row.label} style={s.statRow}>
              <Text style={s.statLabel}>{row.label}</Text>
              <Text style={s.statValue}>{row.value}</Text>
            </View>
          ))}

          {keywords.length > 0 && (
            <>
              <View style={s.reviewInnerDivider} />
              <View style={s.keywordRow}>
                {keywords.map((kw) => (
                  <View key={kw.text} style={s.keywordPill}>
                    <Text style={s.keywordText}>{kw.text}</Text>
                    <View style={s.kwCountBadge}>
                      <Text style={s.kwCountText}>{kw.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {reviewCount > 0 && (
            <>
              <View style={s.reviewInnerDivider} />
              <TouchableOpacity
                style={s.reviewHeader}
                onPress={onPressReviews}
                activeOpacity={onPressReviews ? 0.7 : 1}
                disabled={!onPressReviews}
              >
                <Text style={s.reviewHeaderTitle}>💬 팀원 리뷰</Text>
                <View style={s.reviewHeaderRight}>
                  <Text style={s.reviewCount}>{reviewCount}개</Text>
                  {onPressReviews && <Text style={s.reviewChevron}>›</Text>}
                </View>
              </TouchableOpacity>

              {comments.length > 0 && (
                <View style={s.commentList}>
                  {comments.map((c, i) => (
                    <View key={i} style={s.commentCard}>
                      <Text style={s.commentQuote}>"{c.content}"</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </>
      ) : (
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>{emptyText ?? '아직 받은 리뷰가 없어요'}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
  },
  tempCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 4,
  },
  tempScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tempScore: { fontSize: 52, fontWeight: '700', color: Colors.primary, lineHeight: 56 },
  tempScoreMax: { fontSize: 18, color: Colors.grayMedium, marginBottom: 6 },
  starRow: { paddingHorizontal: 16, marginBottom: 8 },
  statDivider: { height: 1, backgroundColor: '#F0F0F0', marginTop: 4 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  statLabel: { fontSize: 13, color: Colors.grayMedium, width: 72 },
  statValue: { fontSize: 13, color: Colors.dark, flex: 1, textAlign: 'right' },
  reviewInnerDivider: { height: 1, backgroundColor: '#F0F0F0' },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  keywordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.white,
  },
  keywordText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  kwCountBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kwCountText: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  reviewHeaderTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  reviewHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewCount: { fontSize: 13, color: Colors.grayMedium },
  reviewChevron: { fontSize: 18, color: Colors.grayLight },
  emptyWrap: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyText: { fontSize: 13, color: Colors.grayMedium },

  commentList: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  commentCard: {
    backgroundColor: Colors.pageBg,
    borderRadius: 10,
    padding: 12,
  },
  commentQuote: { fontSize: 13, color: Colors.dark, lineHeight: 19, marginBottom: 4 },
});
