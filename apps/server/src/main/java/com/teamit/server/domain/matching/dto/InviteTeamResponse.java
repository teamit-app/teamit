package com.teamit.server.domain.matching.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InviteTeamResponse {
    private Long invitationId;
    private String status;
    private Long chatRoomId;
}
