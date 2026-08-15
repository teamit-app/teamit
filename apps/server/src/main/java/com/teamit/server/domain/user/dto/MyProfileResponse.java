package com.teamit.server.domain.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.entity.VerificationStatus;
import com.teamit.server.domain.region.entity.UserRegion;
import com.teamit.server.domain.user.entity.Gender;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.entity.UserSkill;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class MyProfileResponse {

    private Long userId;
    private String nickname;
    private String name;
    private Gender gender;
    private LocalDate birthDate;
    private String profileImageUrl;
    @JsonProperty("isMatchingActive")
    private boolean isMatchingActive;
    private boolean needsOnboarding;
    private boolean needsTermsReconsent;
    private double averageRating;
    private List<MatchingProfileData.RegionInfo> regions;
    private EducationInfo education;
    private List<SkillItem> skills;
    private List<CareerItemResponse> careers;
    private List<Object> reviews;

    @Getter
    @Builder
    public static class EducationInfo {
        private Long educationId;
        private String schoolName;
        private String status;
        private String major;
        private String subMajor;
        private boolean verified;
        private VerificationStatus verificationStatus;
        private String verificationDocType;
        private String verificationFileName;
        private String verificationSubmittedAt;
        private String verificationRejectReason;

        public static EducationInfo from(Education education) {
            VerificationStatus status = education.getEffectiveVerificationStatus();
            return EducationInfo.builder()
                    .educationId(education.getId())
                    .schoolName(education.getSchoolName())
                    .status(education.getStatus().name())
                    .major(education.getMajor())
                    .subMajor(education.getSubMajor())
                    .verified(status == VerificationStatus.APPROVED)
                    .verificationStatus(status)
                    .verificationDocType(education.getVerificationDocType() != null
                            ? education.getVerificationDocType().name() : null)
                    .verificationFileName(education.getVerificationFileName())
                    .verificationSubmittedAt(education.getVerificationSubmittedAt() != null
                            ? education.getVerificationSubmittedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                            : null)
                    .verificationRejectReason(education.getVerificationRejectReason())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class SkillItem {
        private Long userSkillId;
        private String skillName;
        private Integer level;

        public static SkillItem from(UserSkill userSkill) {
            return SkillItem.builder()
                    .userSkillId(userSkill.getId())
                    .skillName(userSkill.getEffectiveSkillName())
                    .level(userSkill.getLevel())
                    .build();
        }
    }

    public static MyProfileResponse of(User user, boolean needsOnboarding, boolean needsTermsReconsent,
                                        List<UserRegion> regions, Education education, List<UserSkill> skills,
                                        List<CareerItemResponse> careers, double averageRating) {
        List<MatchingProfileData.RegionInfo> regionInfos = regions.stream()
                .map(r -> new MatchingProfileData.RegionInfo(r.getSido(), r.getSigungu()))
                .collect(Collectors.toList());

        List<SkillItem> skillItems = skills.stream()
                .map(SkillItem::from)
                .collect(Collectors.toList());

        return MyProfileResponse.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .name(user.getName())
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .profileImageUrl(user.getProfileImageUrl())
                .isMatchingActive(Boolean.TRUE.equals(user.getIsMatchingActive()))
                .needsOnboarding(needsOnboarding)
                .needsTermsReconsent(needsTermsReconsent)
                .averageRating(averageRating)
                .regions(regionInfos)
                .education(education != null ? EducationInfo.from(education) : null)
                .skills(skillItems)
                .careers(careers)
                .reviews(List.of())
                .build();
    }
}
