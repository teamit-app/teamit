package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.user.entity.Gender;
import com.teamit.server.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class HeartedUserResponse {

    private Long userId;
    private String nickname;
    private Gender gender;
    private String schoolName;
    private List<UserSkillInfo> skills;

    public static HeartedUserResponse of(User user, Education education, List<UserSkillInfo> skills) {
        return HeartedUserResponse.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .gender(user.getGender())
                .schoolName(education != null ? education.getSchoolName() : null)
                .skills(skills)
                .build();
    }
}
