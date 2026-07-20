package com.teamit.server.domain.review.service;

import com.teamit.server.domain.review.entity.TeamReview;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 받은 리뷰 목록으로부터 항목별 평균 점수 + 가장 가까운 텍스트 지표를 계산한다.
 * 프론트엔드 src/utils/reviewStats.ts의 계산 로직과 동일한 기준(점수가 높을수록 좋음)을 사용한다.
 */
public class ReviewStatsCalculator {

    private static final Map<String, Integer> RESPONSE_SPEED_SCORES = Map.of(
            "1시간 이내", 5, "반나절 이내", 4, "하루 이내", 3, "이틀 이상", 2, "잠수", 1
    );
    private static final Map<String, Integer> DEADLINE_SCORES = Map.of(
            "항상 제때", 5, "대부분 제때", 4, "가끔 늦음", 3, "자주 늦음", 2, "항상 늦음", 1
    );
    private static final Map<String, Integer> INTENSITY_SCORES = Map.of(
            "매우 적극적 참여", 5, "적극적 참여", 4, "보통 참여", 3, "소극적 참여", 2, "참여하지 않음", 1
    );
    private static final Map<Integer, String> TOTAL_RATING_LABELS = Map.of(
            5, "★★★★★", 4, "★★★★☆", 3, "★★★☆☆", 2, "★★☆☆☆", 1, "★☆☆☆☆"
    );
    private static final Map<Integer, String> RESPONSE_SPEED_LABELS = invert(RESPONSE_SPEED_SCORES);
    private static final Map<Integer, String> DEADLINE_LABELS = invert(DEADLINE_SCORES);
    private static final Map<Integer, String> INTENSITY_LABELS = invert(INTENSITY_SCORES);

    private ReviewStatsCalculator() {}

    private static Map<Integer, String> invert(Map<String, Integer> src) {
        Map<Integer, String> result = new HashMap<>();
        src.forEach((label, score) -> result.put(score, label));
        return result;
    }

    /** "총평"은 리뷰 작성 1단계에서 직접 받는 전체 평점(totalRating)의 평균이다. */
    public static String totalRatingLabel(List<TeamReview> reviews) {
        if (reviews.isEmpty()) return "";
        double avg = reviews.stream().mapToInt(TeamReview::getTotalRating).average().orElse(0);
        int rounded = clampRound(avg, 1, 5);
        return String.format("%s (%.2f점)", TOTAL_RATING_LABELS.getOrDefault(rounded, "-"), avg);
    }

    public static String responseSpeedLabel(List<TeamReview> reviews) {
        return labelFor(reviews, TeamReview::getResponseSpeed, RESPONSE_SPEED_SCORES, RESPONSE_SPEED_LABELS, 1, 5);
    }

    public static String deadlineLabel(List<TeamReview> reviews) {
        return labelFor(reviews, TeamReview::getDeadlineCompletion, DEADLINE_SCORES, DEADLINE_LABELS, 1, 5);
    }

    public static String intensityLabel(List<TeamReview> reviews) {
        return labelFor(reviews, TeamReview::getParticipationIntensity, INTENSITY_SCORES, INTENSITY_LABELS, 1, 5);
    }

    private static String labelFor(List<TeamReview> reviews, Function<TeamReview, String> picker,
                                    Map<String, Integer> scores, Map<Integer, String> labels, int min, int max) {
        if (reviews.isEmpty()) return "";
        double avg = reviews.stream().mapToInt(r -> scores.getOrDefault(picker.apply(r), 0)).average().orElse(0);
        int rounded = clampRound(avg, min, max);
        return String.format("%s (%.2f점)", labels.getOrDefault(rounded, "-"), avg);
    }

    /** 리뷰 1건의 별점 = 리뷰 작성 1단계에서 직접 받은 전체 평점(totalRating) */
    public static double reviewerStarRating(TeamReview review) {
        return review.getTotalRating();
    }

    public static List<Map.Entry<String, Long>> keywordFrequency(List<TeamReview> reviews) {
        Map<String, Long> counts = reviews.stream()
                .flatMap(r -> r.getKeywords().stream())
                .collect(Collectors.groupingBy(k -> k, Collectors.counting()));
        return counts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toList());
    }

    private static int clampRound(double avg, int min, int max) {
        return Math.min(max, Math.max(min, (int) Math.round(avg)));
    }
}
