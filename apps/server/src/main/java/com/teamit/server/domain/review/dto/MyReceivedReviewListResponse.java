package com.teamit.server.domain.review.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

// 마이페이지 "리뷰 확인" — 프로젝트/공모전 구분 없이 내가 받은 리뷰 전체를 집계한 결과
@Getter
@Builder
public class MyReceivedReviewListResponse {
    private double averageRating;
    private int totalCount;
    private List<AnonymousReviewItem> reviews;
}
