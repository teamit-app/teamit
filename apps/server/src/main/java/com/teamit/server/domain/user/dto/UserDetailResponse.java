package com.teamit.server.domain.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.post.dto.PostListItemResponse;
import com.teamit.server.domain.region.entity.UserRegion;
import com.teamit.server.domain.user.entity.AwardStatus;
import com.teamit.server.domain.user.entity.Career;
import com.teamit.server.domain.user.entity.CareerType;
import com.teamit.server.domain.user.entity.MatchingProfile;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.entity.UserSkill;
import com.teamit.server.domain.review.service.ReviewStatsCalculator;
import lombok.Builder;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class UserDetailResponse {

    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private String gender;
    private String schoolName;
    private String major;
    private String status;
    private boolean verified;
    @JsonProperty("isMatchingActive")
    private boolean isMatchingActive;
    @JsonProperty("isHearted")
    private boolean isHearted;
    private List<String> skills;
    private List<String> certificates;
    private String location;
    private double averageRating;
    private String appealTitle;
    private String appealContent;
    private List<String> skillsDisplay;
    private String contestExperienceDetail;
    private String intensityDetail;
    private String meetingPreference;
    private String teamVibeDetail;
    private String feedbackStyleDetail;
    private String leadershipDetail;
    private List<ContestHistoryItem> contestHistory;
    private List<CertificationItem> certifications;
    private List<RecruitPostItem> recruitPosts;
    private ReviewStats reviewStats;
    private List<ReviewKeyword> reviewKeywords;
    private List<TeamReview> teamReviews;

    public record ContestHistoryItem(String title, String role, String award) {}
    public record CertificationItem(String name, String acquiredDate) {}
    public record ReviewStats(String totalRating, String responseSpeed,
                              String deadlineCompletion, String participationIntensity) {}
    public record ReviewKeyword(String text, int count) {}
    // 리뷰어 정보는 절대 포함하지 않는다(익명 정책) — 어디서 리뷰를 보여주든 동일
    public record TeamReview(String content, Double rating) {}
    public record RecruitPostItem(Long postId, Long contestId, String title, String createdAt,
                                   int views, int chatCount, int likeCount, List<String> skills,
                                   String experienceCondition, String meetingType, String location,
                                   int currentMembers, int totalMembers) {
        public static RecruitPostItem from(PostListItemResponse p) {
            return new RecruitPostItem(
                    p.getPostId(), p.getContestId(), p.getTitle(), p.getCreatedAt(),
                    p.getViewCount() != null ? p.getViewCount() : 0,
                    p.getCommentCount() != null ? p.getCommentCount() : 0,
                    p.getLikeCount() != null ? p.getLikeCount() : 0,
                    p.getSkills(), p.getExperienceCondition(), p.getOnlineOffline(), p.getRegion(),
                    p.getCurrentMembers() != null ? p.getCurrentMembers() : 0,
                    p.getRecruitCount() != null ? p.getRecruitCount() + 1 : 0
            );
        }
    }

    public static UserDetailResponse from(User user,
                                          Education education,
                                          List<UserSkill> userSkills,
                                          List<UserRegion> userRegions,
                                          MatchingProfile profile,
                                          List<com.teamit.server.domain.review.entity.TeamReview> receivedReviews,
                                          List<Career> careers,
                                          List<PostListItemResponse> myPosts,
                                          boolean isHearted) {
        List<String> skillNames = (profile != null && profile.getSkillsCsv() != null && !profile.getSkillsCsv().isBlank())
                ? Arrays.stream(profile.getSkillsCsv().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList())
                : userSkills.stream()
                        .map(UserSkill::getEffectiveSkillName)
                        .collect(Collectors.toList());

        String regionsJoined = userRegions.stream()
                .map(r -> r.getSigungu() != null ? r.getSido() + " " + r.getSigungu() : r.getSido())
                .collect(Collectors.joining(", "));

        // MatchingProfile에서 레이블 변환
        String appealTitle = "";
        String appealContent = "";
        String contestExperienceDetail = "";
        String intensityDetail = "";
        String meetingPreference = "";
        String teamVibeDetail = "";
        String feedbackStyleDetail = "";
        String leadershipDetail = "";

        if (profile != null) {
            appealTitle = profile.getAppealTitle() != null ? profile.getAppealTitle() : "";
            appealContent = profile.getAppealContent() != null ? profile.getAppealContent() : "";

            contestExperienceDetail = ExperiencePurposeLabels.combined(
                    profile.getExperienceLevel(), profile.getParticipationPurpose());
            if (profile.getIntensityLevel() != null) {
                intensityDetail = switch (profile.getIntensityLevel()) {
                    case 1 -> "주 1~3h";
                    case 2 -> "주 4~7h";
                    case 3 -> "주 8~14h";
                    case 4 -> "주 15h+";
                    default -> "";
                };
            }
            if (profile.getOnlineOfflinePref() != null) {
                String prefLabel = switch (profile.getOnlineOfflinePref()) {
                    case "ONLINE" -> "온라인";
                    case "OFFLINE" -> "오프라인";
                    case "MIXED" -> "온오프라인 모두 가능";
                    default -> profile.getOnlineOfflinePref();
                };
                meetingPreference = (!"ONLINE".equals(profile.getOnlineOfflinePref()) && !regionsJoined.isEmpty())
                        ? prefLabel + " · " + regionsJoined
                        : prefLabel;
            }
            if (profile.getTeamVibe() != null) {
                teamVibeDetail = switch (profile.getTeamVibe()) {
                    case 1 -> "팀 분위기 최우선";
                    case 2 -> "팀 분위기 우선";
                    case 3 -> "균형 중시";
                    case 4 -> "결과 우선";
                    case 5 -> "결과 최우선";
                    default -> "";
                };
            }
            if (profile.getFeedbackStyle() != null) {
                feedbackStyleDetail = switch (profile.getFeedbackStyle()) {
                    case 1 -> "매우 부드럽게";
                    case 2 -> "부드럽게";
                    case 3 -> "상황에 따라요";
                    case 4 -> "솔직하게";
                    case 5 -> "매우 솔직하게";
                    default -> "";
                };
            }
            if (profile.getLeadershipPref() != null) {
                leadershipDetail = switch (profile.getLeadershipPref()) {
                    case "WANT" -> "리더 선호";
                    case "IF_NEEDED" -> "리더 가능";
                    case "DONT_WANT" -> "팔로워 선호";
                    default -> profile.getLeadershipPref();
                };
            }
        }

        List<ReviewKeyword> reviewKeywords = ReviewStatsCalculator.keywordFrequency(receivedReviews).stream()
                .map(e -> new ReviewKeyword(e.getKey(), e.getValue().intValue()))
                .collect(Collectors.toList());

        List<TeamReview> teamReviews = receivedReviews.stream()
                .filter(r -> r.getComment() != null && !r.getComment().isBlank())
                .map(r -> new TeamReview(
                        r.getComment(),
                        ReviewStatsCalculator.reviewerStarRating(r)
                ))
                .collect(Collectors.toList());

        double averageRating = receivedReviews.stream()
                .mapToInt(com.teamit.server.domain.review.entity.TeamReview::getTotalRating)
                .average()
                .orElse(0.0);

        List<ContestHistoryItem> contestHistory = careers.stream()
                .filter(c -> c.getCareerType() == CareerType.CONTEST)
                .map(c -> new ContestHistoryItem(
                        c.getContestName(),
                        (c.getRolesCsv() != null && !c.getRolesCsv().isBlank())
                                ? String.join(", ", c.getRolesCsv().split(","))
                                : "",
                        c.getAwardStatus() == AwardStatus.AWARDED ? "수상" : null
                ))
                .collect(Collectors.toList());

        List<CertificationItem> certifications = careers.stream()
                .filter(c -> c.getCareerType() == CareerType.CERTIFICATE)
                .map(c -> new CertificationItem(
                        c.getCertName(),
                        c.getAcquiredDate() != null ? c.getAcquiredDate().toString() : ""
                ))
                .collect(Collectors.toList());

        List<RecruitPostItem> recruitPosts = myPosts.stream()
                .map(RecruitPostItem::from)
                .collect(Collectors.toList());

        return UserDetailResponse.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .schoolName(education != null ? education.getSchoolName() : "")
                .major(education != null ? education.getMajor() : "")
                .status(education != null ? education.getStatus().name() : null)
                .verified(education != null && education.isVerified())
                .isMatchingActive(Boolean.TRUE.equals(user.getIsMatchingActive()))
                .isHearted(isHearted)
                .skills(skillNames)
                .certificates(List.of())
                .location(regionsJoined)
                .averageRating(Math.round(averageRating * 10) / 10.0)
                .appealTitle(appealTitle)
                .appealContent(appealContent)
                .skillsDisplay(skillNames)
                .contestExperienceDetail(contestExperienceDetail)
                .intensityDetail(intensityDetail)
                .meetingPreference(meetingPreference)
                .teamVibeDetail(teamVibeDetail)
                .feedbackStyleDetail(feedbackStyleDetail)
                .leadershipDetail(leadershipDetail)
                .contestHistory(contestHistory)
                .certifications(certifications)
                .recruitPosts(recruitPosts)
                .reviewStats(new ReviewStats(
                        ReviewStatsCalculator.totalRatingLabel(receivedReviews),
                        ReviewStatsCalculator.responseSpeedLabel(receivedReviews),
                        ReviewStatsCalculator.deadlineLabel(receivedReviews),
                        ReviewStatsCalculator.intensityLabel(receivedReviews)
                ))
                .reviewKeywords(reviewKeywords)
                .teamReviews(teamReviews)
                .build();
    }
}
