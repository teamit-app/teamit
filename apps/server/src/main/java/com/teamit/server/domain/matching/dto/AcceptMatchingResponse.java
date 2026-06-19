package com.teamit.server.domain.matching.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AcceptMatchingResponse {
    private Long groupChatRoomId;
}
