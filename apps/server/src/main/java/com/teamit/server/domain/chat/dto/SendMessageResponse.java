package com.teamit.server.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SendMessageResponse {
    private Long messageId;
    private LocalDateTime createdAt;
}
