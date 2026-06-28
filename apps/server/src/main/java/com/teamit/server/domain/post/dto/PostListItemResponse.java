package com.teamit.server.domain.post.dto;

import com.teamit.server.domain.post.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PostListItemResponse {
    private Long postId;
    private Long contestId;
    private String title;
    private String createdAt;
    private int views;
    private int chatCount;
    private int likeCount;
    private List<String> skills;
    private String experienceCondition;
    private String meetingType;
    private String location;
    private String intensity;
    private int currentMembers;
    private int totalMembers;
    private boolean isHearted;
    private String status;

    public static PostListItemResponse from(Post post) {
        return PostListItemResponse.builder()
                .postId(post.getId())
                .contestId(post.getContestId())
                .title(post.getTitle())
                .createdAt(post.getCreatedAt().toLocalDate().toString())
                .views(0)
                .chatCount(0)
                .likeCount(0)
                .skills(List.of())
                .experienceCondition("")
                .meetingType(post.getOnlineOffline() != null ? post.getOnlineOffline() : "MIXED")
                .location("")
                .intensity("")
                .currentMembers(1)
                .totalMembers(post.getRecruitCount() != null ? post.getRecruitCount() : 0)
                .isHearted(false)
                .status(post.getStatus().name())
                .build();
    }
}
