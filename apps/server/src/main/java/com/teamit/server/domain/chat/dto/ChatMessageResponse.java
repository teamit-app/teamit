package com.teamit.server.domain.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.chat.entity.ChatMessage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private Long messageId;
    private Long senderId;
    private String senderNickname;
    private String content;

    // boolean 필드에 @JsonProperty를 명시해 JSON key를 "isRead"로 고정
    @JsonProperty("isRead")
    private boolean isRead;

    private LocalDateTime createdAt;

    public static ChatMessageResponse from(ChatMessage message, Long lastReadMessageId) {
        boolean read = lastReadMessageId != null && message.getId() <= lastReadMessageId;
        return ChatMessageResponse.builder()
                .messageId(message.getId())
                .senderId(message.getSender().getId())
                .senderNickname(message.getSender().getNickname())
                .content(message.getContent())
                .isRead(read)
                .createdAt(message.getCreatedAt())
                .build();
    }
}
