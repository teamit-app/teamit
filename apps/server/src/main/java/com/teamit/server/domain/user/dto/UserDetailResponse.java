package com.teamit.server.domain.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.contest.entity.ContestParticipant;
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
                                          ContestParticipant contestSnapshot,
                                          List<com.teamit.server.domain.review.entity.TeamReview> receivedReviews,
                                          List<Career> careers,
                                          List<PostListItemResponse> myPosts,
                                          boolean isHearted) {
        // 참여정보(기술/경험/강도/온오프라인/팀분위기/피드백/리더십)는 contestSnapshot이 있으면
        // 그 공모전 등록 시점 스냅샷을 우선 쓰고, 없으면 기존처럼 라이브 매칭 프로필을 쓴다.
        // contestId 없이 호출되는 기존 경로(contestSnapshot=null)는 아래 로직이 전부 profile로만
        // 귀결되어 이전 동작과 동일하다.
        List<String> skillNames;
        if (contestSnapshot != null) {
            skillNames = (contestSnapshot.getSkillsCsv() != null && !contestSnapshot.getSkillsCsv().isBlank())
                    ? Arrays.stream(contestSnapshot.getSkillsCsv().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList())
                    : List.of();
        } else {
            skillNames = (profile != null && profile.getSkillsCsv() != null && !profile.getSkillsCsv().isBlank())
                    ? Arrays.stream(profile.getSkillsCsv().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList())
                    : userSkills.stream()
                            .map(UserSkill::getEffectiveSkillName)
                            .collect(Collectors.toList());
        }

        String regionsJoined = userRegions.stream()
                .map(r -> r.getSigungu() != null ? r.getSido() + " " + r.getSigungu() : r.getSido())
                .collect(Collectors.joining(", "));

        // 참여 정보 섹션(meetingPreference)에 붙는 지역은 contestSnapshot이 있으면 그 등록 시점
        // 스냅샷 지역을 쓴다. 상단 location 필드는 공모전과 무관한 일반 프로필 정보라 그대로 둔다.
        String meetingRegionLabel = contestSnapshot != null
                ? buildRegionLabel(contestSnapshot.getRegionsSnapshot())
                : regionsJoined;

        Integer experienceLevel = contestSnapshot != null ? contestSnapshot.getExperienceLevel()
                : (profile != null ? profile.getExperienceLevel() : null);
        String participationPurpose = contestSnapshot != null ? contestSnapshot.getParticipationPurpose()
                : (profile != null ? profile.getParticipationPurpose() : null);
        Integer intensityLevel = contestSnapshot != null ? contestSnapshot.getIntensityLevel()
                : (profile != null ? profile.getIntensityLevel() : null);
        String onlineOfflinePref = contestSnapshot != null ? contestSnapshot.getOnlineOfflinePref()
                : (profile != null ? profile.getOnlineOfflinePref() : null);
        Integer teamVibe = contestSnapshot != null ? contestSnapshot.getTeamVibe()
                : (profile != null ? profile.getTeamVibe() : null);
        Integer feedbackStyle = contestSnapshot != null ? contestSnapshot.getFeedbackStyle()
                : (profile != null ? profile.getFeedbackStyle() : null);
        String leadershipPref = contestSnapshot != null ? contestSnapshot.getLeadershipPref()
                : (profile != null ? profile.getLeadershipPref() : null);
        String rawAppealTitle = contestSnapshot != null ? contestSnapshot.getAppealTitle()
                : (profile != null ? profile.getAppealTitle() : null);
        String rawAppealContent = contestSnapshot != null ? contestSnapshot.getAppealContent()
                : (profile != null ? profile.getAppealContent() : null);

        // 레이블 변환
        String appealTitle = "";
        String appealContent = "";
        String contestExperienceDetail = "";
        String intensityDetail = "";
        String meetingPreference = "";
        String teamVibeDetail = "";
        String feedbackStyleDetail = "";
        String leadershipDetail = "";

        if (contestSnapshot != null || profile != null) {
            appealTitle = rawAppealTitle != null ? rawAppealTitle : "";
            appealContent = rawAppealContent != null ? rawAppealContent : "";

            contestExperienceDetail = ExperiencePurposeLabels.combined(experienceLevel, participationPurpose);
            if (intensityLevel != null) {
                intensityDetail = switch (intensityLevel) {
                    case 1 -> "주 1~3h";
                    case 2 -> "주 4~7h";
                    case 3 -> "주 8~14h";
                    case 4 -> "주 15h+";
                    default -> "";
                };
            }
            if (onlineOfflinePref != null) {
                String prefLabel = switch (onlineOfflinePref) {
                    case "ONLINE" -> "온라인";
                    case "OFFLINE" -> "오프라인";
                    case "MIXED" -> "온오프라인 모두 가능";
                    default -> onlineOfflinePref;
                };
                meetingPreference = (!"ONLINE".equals(onlineOfflinePref) && !meetingRegionLabel.isEmpty())
                        ? prefLabel + " · " + meetingRegionLabel
                        : prefLabel;
            }
            if (teamVibe != null) {
                teamVibeDetail = switch (teamVibe) {
                    case 1 -> "팀 분위기 최우선";
                    case 2 -> "팀 분위기 우선";
                    case 3 -> "균형 중시";
                    case 4 -> "결과 우선";
                    case 5 -> "결과 최우선";
                    default -> "";
                };
            }
            if (feedbackStyle != null) {
                feedbackStyleDetail = switch (feedbackStyle) {
                    case 1 -> "매우 부드럽게";
                    case 2 -> "부드럽게";
                    case 3 -> "상황에 따라요";
                    case 4 -> "솔직하게";
                    case 5 -> "매우 솔직하게";
                    default -> "";
                };
            }
            if (leadershipPref != null) {
                leadershipDetail = switch (leadershipPref) {
                    case "WANT" -> "리더 선호";
                    case "IF_NEEDED" -> "리더 가능";
                    case "DONT_WANT" -> "팔로워 선호";
                    default -> leadershipPref;
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
                .status(education != null && education.getStatus() != null ? education.getStatus().name() : null)
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

    // ContestParticipant.regionsSnapshot 포맷("시도|시군구;시도|시군구")을 사람이 읽는 라벨로 변환
    // (PostApplicantResponse.buildRegionLabel과 동일한 포맷 파서)
    private static String buildRegionLabel(String regionsSnapshot) {
        if (regionsSnapshot == null || regionsSnapshot.isBlank()) return "";
        return Arrays.stream(regionsSnapshot.split(";"))
                .map(entry -> {
                    String[] parts = entry.split("\\|", -1);
                    String sido = parts[0];
                    String sigungu = parts.length > 1 && !parts[1].isEmpty() ? parts[1] : null;
                    return sigungu != null ? sido + " " + sigungu : sido;
                })
                .collect(Collectors.joining(", "));
    }
}
