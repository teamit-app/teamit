package com.teamit.server.domain.review.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ReceivedReviewResponse {
    private Long reviewerId;
    private String reviewerName;
    private Integer totalRating;
    private String responseSpeed;
    private String deadlineCompletion;
    private String participationIntensity;
    private List<String> keywords;
    private String comment;
    private LocalDateTime createdAt;
}
