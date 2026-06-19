package com.teamit.server.domain.matching.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteTeamRequest {
    private Long senderId;
    private Long receiverId;
    private String message;
}
