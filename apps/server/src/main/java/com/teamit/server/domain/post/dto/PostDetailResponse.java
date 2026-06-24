package com.teamit.server.domain.post.dto;

import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PostDetailResponse {
    private Long postId;
    private Long contestId;
    private String title;
    private String content;
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
    private String deadline;
    private String genderCondition;
    private String schoolCondition;

    // 공모전 정보
    private String teamName;
    private String contestName;
    private String contestPeriod;

    // 팀원 목록 (향후 확장)
    private List<Object> members;

    // 모집자 정보
    private RecruiterInfo recruiter;

    // 댓글 목록 (향후 확장)
    private List<Object> comments;

    @Getter
    @Builder
    public static class RecruiterInfo {
        private String name;
        private List<String> skills;
        private String experienceCount;
        private String intensity;
        private String meetingType;
        private String location;
        private String teamVibe;
        private String leadershipStyle;
    }

    public static PostDetailResponse of(Post post, Contest contest, User owner) {
        String contestName = contest != null ? contest.getTitle() : "";
        String contestPeriod = contest != null && contest.getStartDate() != null && contest.getEndDate() != null
                ? contest.getStartDate() + " ~ " + contest.getEndDate()
                : "";

        RecruiterInfo recruiter = RecruiterInfo.builder()
                .name(owner.getNickname())
                .skills(List.of())
                .experienceCount("")
                .intensity("")
                .meetingType(post.getOnlineOffline() != null ? post.getOnlineOffline() : "MIXED")
                .location("")
                .teamVibe("")
                .leadershipStyle("")
                .build();

        return PostDetailResponse.builder()
                .postId(post.getId())
                .contestId(post.getContestId())
                .title(post.getTitle())
                .content(post.getDescription() != null ? post.getDescription() : "")
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
                .deadline(post.getDeadline() != null ? post.getDeadline() : "")
                .genderCondition(post.getGenderCondition() != null ? post.getGenderCondition() : "ANY")
                .schoolCondition(post.getSchoolCondition() != null ? post.getSchoolCondition() : "ANY")
                .teamName(post.getTitle() + " 팀")
                .contestName(contestName)
                .contestPeriod(contestPeriod)
                .members(List.of())
                .recruiter(recruiter)
                .comments(List.of())
                .build();
    }
}
