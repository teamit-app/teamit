package com.teamit.server.domain.review.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ReceivedReviewListResponse {
    private List<ReceivedReviewResponse> reviews;
}
