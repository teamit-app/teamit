package com.teamit.server.domain.review.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SubmitReviewResponse {
    private Long reviewId;
}
