package com.teamit.server.domain.review.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class SubmitReviewRequest {
    private Long receiverId;
    private Integer totalRating;
    private String responseSpeed;
    private String deadlineCompletion;
    private String participationIntensity;
    private List<String> keywords;
    private String comment;
}
