package com.teamit.server.domain.matching.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApplyPostResponse {
    private Long applicationId;
    private String status;
    private Long chatRoomId;
}
