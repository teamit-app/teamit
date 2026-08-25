package com.teamit.server.domain.post.dto;

import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Getter
@Builder
public class PostListItemResponse {
    private Long postId;
    private Long contestId;
    private Long chatRoomId;
    private String title;
    private String description;
    private String status;
    private Integer recruitCount;
    private String deadline;
    private String onlineOffline;
    private String genderCondition;
    private String experienceCondition;
    private String recruiterGender;
    private List<String> skills;
    private String region;
    private String createdAt;
    private Integer currentMembers;
    private Long ownerUserId;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Integer applicantCount;
    private String contestTitle;

    public static PostListItemResponse from(Post post, User owner, int currentMembers, List<String> skills,
                                              String region, long likeCount, long commentCount, long applicantCount,
                                              String contestTitle, String effectiveStatus) {
        return PostListItemResponse.builder()
                .postId(post.getId())
                .contestId(post.getContestId())
                .chatRoomId(post.getChatRoomId())
                .ownerUserId(post.getOwner().getId())
                .title(post.getTitle())
                .description(post.getDescription())
                .status(effectiveStatus)
                .recruitCount(post.getRecruitCount())
                .deadline(post.getDeadline())
                .onlineOffline(post.getOnlineOffline())
                .genderCondition(post.getGenderCondition())
                .experienceCondition(post.getExperienceCondition())
                .recruiterGender(owner.getGender() != null ? owner.getGender().name() : null)
                .skills(skills)
                .region(region)
                .createdAt(post.getCreatedAt() != null
                        ? post.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                        : null)
                .currentMembers(currentMembers)
                .viewCount(post.getViewCount())
                .likeCount((int) likeCount)
                .commentCount((int) commentCount)
                .applicantCount((int) applicantCount)
                .contestTitle(contestTitle)
                .build();
    }
}
