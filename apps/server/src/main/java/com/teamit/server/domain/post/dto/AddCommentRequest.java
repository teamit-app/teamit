package com.teamit.server.domain.post.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AddCommentRequest {
    private String content;
    private Long parentId;
}
