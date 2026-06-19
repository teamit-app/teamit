package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.user.entity.Gender;
import com.teamit.server.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class UserPoolResponse {

    private Long userId;
    private String nickname;
    private Gender gender;
    private String schoolName;
    private String major;
    private Boolean verified;
    private List<UserSkillInfo> skills;
    private List<String> certificates;
    private Boolean isMatchingActive;

    public static UserPoolResponse of(User user, Education education, List<UserSkillInfo> skills) {
        return UserPoolResponse.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .gender(user.getGender())
                .schoolName(education != null ? education.getSchoolName() : null)
                .major(education != null ? education.getMajor() : null)
                .verified(education != null ? education.isVerified() : null)
                .skills(skills)
                .certificates(List.of())
                .isMatchingActive(user.getIsMatchingActive())
                .build();
    }
}
