package com.teamit.server.domain.post.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class UpdatePostRequest {
    private String title;
    private String description;
    // 아래 필드들은 아직 합류한 팀원이 없는 모집글에서만 적용됨(PostService.updatePost 참고)
    private Integer recruitCount;
    private String onlineOffline;
    private String genderCondition;
    private String schoolCondition;
    private String experienceCondition;
    private String purposeCondition;
    private List<RequiredSkillRequest> requiredSkills;
}
