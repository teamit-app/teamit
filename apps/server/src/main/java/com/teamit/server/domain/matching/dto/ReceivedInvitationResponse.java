package com.teamit.server.domain.matching.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReceivedInvitationResponse {
    private Long invitationId;
    private Long postId;
    private String title;
    private int currentMembers;
    private int totalMembers;
    private String contestName;
    private String senderName;
    private String receivedAt;
}
