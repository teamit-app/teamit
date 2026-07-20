package com.teamit.server.domain.post.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CreatePostRequest {
    private String title;
    private String description;
    private Long contestId;
    private Integer recruitCount;
    private String deadline;
    private String onlineOffline;
    private String genderCondition;
    private String schoolCondition;
    private String experienceCondition;
    private String purposeCondition;
    private List<RequiredSkillRequest> requiredSkills;
}
