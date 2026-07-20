package com.teamit.server.domain.matching.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteTeamRequest {
    // senderId는 JWT에서 추출 — 요청 바디에서 제거
    private Long receiverId;
    private String message;
}
