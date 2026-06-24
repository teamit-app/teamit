package com.teamit.server.domain.post.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreatePostRequest {
    private String title;
    private String description;
    private Long contestId;
    private Integer recruitCount;
    private String deadline;
    private String onlineOffline;   // ONLINE / OFFLINE / MIXED
    private String genderCondition; // ANY / SAME / OPPOSITE
    private String schoolCondition; // ANY / SAME_SCHOOL
}
