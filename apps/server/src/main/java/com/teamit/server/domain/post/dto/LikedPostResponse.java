package com.teamit.server.domain.post.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class LikedPostResponse {

    private Long postId;
    private Long contestId;
    private String contestTitle;
    private String postTitle;
    private List<String> roles;
    private int teamSize;
    private String deadline;
    private long dDay;
    @JsonProperty("isOpen")
    private boolean isOpen;
}
