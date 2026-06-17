package com.teamit.server.domain.home.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MatchingStatusResponse {
    private long receivedInvitationCount;
    private long appliedTeamCount;
}
