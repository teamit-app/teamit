package com.teamit.server.domain.review.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

// 리뷰어 정보(닉네임/프로필사진)를 절대 포함하지 않는다 — 리뷰는 어디서 보여지든 익명이어야 함
@Getter
@Builder
public class AnonymousReviewItem {
    private Integer totalRating;
    private String responseSpeed;
    private String deadlineCompletion;
    private String participationIntensity;
    private List<String> keywords;
    private String comment;
    private LocalDateTime createdAt;
}
