package com.teamit.server.domain.chat.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {
    private Long senderId;
    private String content;
}
