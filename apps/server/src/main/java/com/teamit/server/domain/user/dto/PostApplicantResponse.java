package com.teamit.server.domain.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.contest.entity.ContestParticipant;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.region.entity.UserRegion;
import com.teamit.server.domain.user.entity.MatchingProfile;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.entity.UserSkill;
import lombok.Builder;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class PostApplicantResponse {

    private Long userId;
    private String nickname;
    private double averageRating;
    private String gender;
    private String school;
    @JsonProperty("isSchoolVerified")
    private boolean isSchoolVerified;
    private String introText;
    private List<String> skills;
    private String meetingTypeLabel;
    private String regionLabel;
    private String experienceLabel;
    private String intensityLabel;
    private String leadershipLabel;
    private String appealTitle;
    private String appealContent;
    // "매칭된 후보"(getCandidates)에서만 계산해 채워준다. "전체 후보"(getAllCandidates)는
    // 하드필터·스코어링을 하지 않으므로 null — 프론트에서 null이면 일치도 배지를 표시하지 않는다.
    private Integer matchScore;

    public static PostApplicantResponse from(User user,
                                             Education education,
                                             List<UserSkill> userSkills,
                                             List<UserRegion> userRegions,
                                             MatchingProfile profile,
                                             double averageRating) {
        List<String> skillNames = userSkills.stream()
                .map(UserSkill::getEffectiveSkillName)
                .collect(Collectors.toList());

        String school = "";
        boolean isVerified = false;
        if (education != null) {
            school = education.getSchoolName() + " " + education.getMajor();
            isVerified = education.isVerified();
        }

        String regionLabel = userRegions.stream()
                .map(r -> r.getSigungu() != null ? r.getSido() + " " + r.getSigungu() : r.getSido())
                .collect(Collectors.joining(", "));

        String appealTitle = "";
        String appealContent = "";
        String experienceLabel = "";
        String intensityLabel = "";
        String meetingTypeLabel = "";
        String leadershipLabel = "";

        if (profile != null) {
            appealTitle = profile.getAppealTitle() != null ? profile.getAppealTitle() : "";
            appealContent = profile.getAppealContent() != null ? profile.getAppealContent() : "";

            experienceLabel = ExperiencePurposeLabels.combined(
                    profile.getExperienceLevel(), profile.getParticipationPurpose());
            if (profile.getIntensityLevel() != null) {
                intensityLabel = switch (profile.getIntensityLevel()) {
                    case 1 -> "주 1~3h";
                    case 2 -> "주 4~7h";
                    case 3 -> "주 8~14h";
                    case 4 -> "주 15h+";
                    default -> "";
                };
            }
            if (profile.getOnlineOfflinePref() != null) {
                meetingTypeLabel = switch (profile.getOnlineOfflinePref()) {
                    case "ONLINE" -> "온라인";
                    case "OFFLINE" -> "오프라인";
                    case "MIXED" -> "온오프라인 모두 가능";
                    default -> profile.getOnlineOfflinePref();
                };
            }
            if (profile.getLeadershipPref() != null) {
                leadershipLabel = switch (profile.getLeadershipPref()) {
                    case "WANT" -> "리더 선호";
                    case "IF_NEEDED" -> "리더 가능";
                    case "DONT_WANT" -> "팔로워 선호";
                    default -> profile.getLeadershipPref();
                };
            }
        }

        return PostApplicantResponse.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .averageRating(averageRating)
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .school(school)
                .isSchoolVerified(isVerified)
                .introText(appealTitle)
                .skills(skillNames)
                .meetingTypeLabel(meetingTypeLabel)
                .regionLabel(regionLabel)
                .experienceLabel(experienceLabel)
                .intensityLabel(intensityLabel)
                .leadershipLabel(leadershipLabel)
                .appealTitle(appealTitle)
                .appealContent(appealContent)
                .build();
    }

    /** 후보 추천(getCandidates) 전용 — 라이브 프로필이 아니라 그 공모전 등록 시점의
     * ContestParticipant 스냅샷 그대로 스킬·지역까지 전부 보여준다. 후보 매칭 기준이
     * 모집자가 모집글을 만든 시점 그대로 고정돼야 하기 때문(라이브 프로필은 이후 바뀔 수 있음). */
    public static PostApplicantResponse fromSnapshot(User user,
                                                      Education education,
                                                      ContestParticipant snapshot,
                                                      double averageRating) {
        return fromSnapshot(user, education, snapshot, averageRating, null);
    }

    public static PostApplicantResponse fromSnapshot(User user,
                                                      Education education,
                                                      ContestParticipant snapshot,
                                                      double averageRating,
                                                      Integer matchScore) {
        List<String> skillNames = (snapshot != null && snapshot.getSkillsCsv() != null && !snapshot.getSkillsCsv().isBlank())
                ? Arrays.stream(snapshot.getSkillsCsv().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList())
                : List.of();

        String school = "";
        boolean isVerified = false;
        if (education != null) {
            school = education.getSchoolName() + " " + education.getMajor();
            isVerified = education.isVerified();
        }

        String regionLabel = snapshot != null ? buildRegionLabel(snapshot.getRegionsSnapshot()) : "";

        String appealTitle = "";
        String appealContent = "";
        String experienceLabel = "";
        String intensityLabel = "";
        String meetingTypeLabel = "";
        String leadershipLabel = "";

        if (snapshot != null) {
            appealTitle    = snapshot.getAppealTitle()   != null ? snapshot.getAppealTitle()   : "";
            appealContent  = snapshot.getAppealContent() != null ? snapshot.getAppealContent() : "";

            experienceLabel = ExperiencePurposeLabels.combined(
                    snapshot.getExperienceLevel(), snapshot.getParticipationPurpose());
            if (snapshot.getIntensityLevel() != null) {
                intensityLabel = switch (snapshot.getIntensityLevel()) {
                    case 1  -> "주 1~3h";
                    case 2  -> "주 4~7h";
                    case 3  -> "주 8~14h";
                    case 4  -> "주 15h+";
                    default -> "";
                };
            }
            if (snapshot.getOnlineOfflinePref() != null) {
                meetingTypeLabel = switch (snapshot.getOnlineOfflinePref()) {
                    case "ONLINE"  -> "온라인";
                    case "OFFLINE" -> "오프라인";
                    case "MIXED"   -> "온오프라인 모두 가능";
                    default        -> snapshot.getOnlineOfflinePref();
                };
            }
            if (snapshot.getLeadershipPref() != null) {
                leadershipLabel = switch (snapshot.getLeadershipPref()) {
                    case "WANT"       -> "리더 선호";
                    case "IF_NEEDED"  -> "리더 가능";
                    case "DONT_WANT"  -> "팔로워 선호";
                    default           -> snapshot.getLeadershipPref();
                };
            }
        }

        return PostApplicantResponse.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .averageRating(averageRating)
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .school(school)
                .isSchoolVerified(isVerified)
                .introText(appealTitle)
                .skills(skillNames)
                .meetingTypeLabel(meetingTypeLabel)
                .regionLabel(regionLabel)
                .experienceLabel(experienceLabel)
                .intensityLabel(intensityLabel)
                .leadershipLabel(leadershipLabel)
                .appealTitle(appealTitle)
                .appealContent(appealContent)
                .matchScore(matchScore)
                .build();
    }

    // ContestParticipant.regionsSnapshot 포맷("시도|시군구;시도|시군구")을 사람이 읽는 라벨로 변환
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
