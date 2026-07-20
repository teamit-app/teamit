package com.teamit.server.domain.contest.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ContestPageResponse {

    private List<ContestListItemResponse> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
