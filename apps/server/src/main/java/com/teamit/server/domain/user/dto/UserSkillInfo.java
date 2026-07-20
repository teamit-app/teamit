package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.user.entity.UserSkill;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSkillInfo {

    private String skillName;
    private Integer level;

    public static UserSkillInfo from(UserSkill userSkill) {
        return UserSkillInfo.builder()
                .skillName(userSkill.getEffectiveSkillName())
                .level(userSkill.getLevel())
                .build();
    }
}
