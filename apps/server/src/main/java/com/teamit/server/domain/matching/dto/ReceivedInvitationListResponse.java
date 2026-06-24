package com.teamit.server.domain.matching.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ReceivedInvitationListResponse {
    private List<ReceivedInvitationResponse> content;
}
