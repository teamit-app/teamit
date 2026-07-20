package com.teamit.server.domain.post.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RequiredSkillRequest {
    private Long skillId;
    private String skillNameCustom;
}
