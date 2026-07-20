package com.teamit.server.domain.contest.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class HeartedContestListResponse {

    private List<ContestListItemResponse> content;
}
