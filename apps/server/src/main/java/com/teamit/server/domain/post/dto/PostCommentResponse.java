package com.teamit.server.domain.post.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.post.entity.PostComment;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class PostCommentResponse {
    private Long commentId;
    private String authorName;
    private String content;
    private String createdAt;
    @JsonProperty("isAuthor")
    private boolean isAuthor;
    @JsonProperty("isReply")
    private boolean isReply;

    public static PostCommentResponse from(PostComment comment, Long postOwnerId) {
        return PostCommentResponse.builder()
                .commentId(comment.getId())
                .authorName(comment.getAuthor().getNickname())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt() != null
                        ? comment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        : null)
                .isAuthor(comment.getAuthor().getId().equals(postOwnerId))
                .isReply(comment.getParent() != null)
                .build();
    }
}
