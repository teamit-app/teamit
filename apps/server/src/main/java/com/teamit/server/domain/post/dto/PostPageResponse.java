package com.teamit.server.domain.post.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PostPageResponse {

    private List<PostListItemResponse> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
