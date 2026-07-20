package com.teamit.server.domain.matching.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SentInvitationResponse {
    private Long invitationId;
    private Long receiverId;
    private String receiverNickname;
    private String status;
}
