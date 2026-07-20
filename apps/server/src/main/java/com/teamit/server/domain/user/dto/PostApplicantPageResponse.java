package com.teamit.server.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PostApplicantPageResponse {

    private List<PostApplicantResponse> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
