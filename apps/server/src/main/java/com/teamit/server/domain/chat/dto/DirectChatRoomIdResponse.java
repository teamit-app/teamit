package com.teamit.server.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DirectChatRoomIdResponse {
    private Long chatRoomId;
}
