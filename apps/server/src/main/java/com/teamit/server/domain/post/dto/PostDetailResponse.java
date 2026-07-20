package com.teamit.server.domain.post.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.chat.dto.TeamMemberInfo;
import com.teamit.server.domain.post.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Getter
@Builder
public class PostDetailResponse {

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
    private String schoolCondition;
    private String experienceCondition;
    // 사람이 읽는 라벨 — genderCondition("SAME"/"ANY")은 모집자 기준 상대 조건이라
    // 모집자 성별과 조합해야 "여자만"/"남자만"으로 확정된다
    private String genderConditionLabel;
    private String schoolConditionLabel;
    private String createdAt;
    private Long ownerUserId;
    private String ownerNickname;
    // 공모전 정보 (contestId로 조회한 결과)
    private String contestTitle;
    private String contestPeriod;
    private List<String> skills;
    private Integer currentMembers;
    private List<TeamMemberInfo> members;
    private RecruiterProfileInfo recruiter;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    @JsonProperty("isHearted")
    private boolean isHearted;
    @JsonProperty("isApplied")
    private boolean isApplied;
    private Long myApplicationId;

    public static PostDetailResponse from(Post post, String contestTitle, String contestPeriod,
                                           List<String> skills, List<TeamMemberInfo> members,
                                           RecruiterProfileInfo recruiter,
                                           long likeCount, long commentCount, boolean isHearted,
                                           Long myApplicationId, String effectiveStatus) {
        long filledCount = members.stream().filter(TeamMemberInfo::isFilled).count();

        String genderConditionLabel = "상관없음";
        if ("SAME".equals(post.getGenderCondition()) && post.getOwner().getGender() != null) {
            genderConditionLabel = switch (post.getOwner().getGender()) {
                case MALE -> "남자만";
                case FEMALE -> "여자만";
            };
        }
        String schoolConditionLabel = "SAME_SCHOOL".equals(post.getSchoolCondition()) ? "같은 학교만" : "상관없음";

        return PostDetailResponse.builder()
                .postId(post.getId())
                .contestId(post.getContestId())
                .chatRoomId(post.getChatRoomId())
                .title(post.getTitle())
                .description(post.getDescription())
                .status(effectiveStatus)
                .recruitCount(post.getRecruitCount())
                .deadline(post.getDeadline())
                .onlineOffline(post.getOnlineOffline())
                .genderCondition(post.getGenderCondition())
                .schoolCondition(post.getSchoolCondition())
                .experienceCondition(post.getExperienceCondition())
                .genderConditionLabel(genderConditionLabel)
                .schoolConditionLabel(schoolConditionLabel)
                .createdAt(post.getCreatedAt() != null
                        ? post.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                        : null)
                .ownerUserId(post.getOwner().getId())
                .ownerNickname(post.getOwner().getNickname())
                .contestTitle(contestTitle)
                .contestPeriod(contestPeriod)
                .skills(skills)
                .currentMembers((int) filledCount)
                .members(members)
                .recruiter(recruiter)
                .viewCount(post.getViewCount())
                .likeCount((int) likeCount)
                .commentCount((int) commentCount)
                .isHearted(isHearted)
                .isApplied(myApplicationId != null)
                .myApplicationId(myApplicationId)
                .build();
    }
}
