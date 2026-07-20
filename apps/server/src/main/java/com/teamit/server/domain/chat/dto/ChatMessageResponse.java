package com.teamit.server.domain.chat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.chat.entity.ChatMessage;
import com.teamit.server.domain.chat.entity.MessageType;
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

    @JsonProperty("isSystem")
    private boolean isSystem;

    private LocalDateTime createdAt;

    // messageType이 INVITATION_CARD일 때만 채워짐 (ChatService에서 조립)
    private InvitationCardInfo invitationCard;

    @Getter
    @Builder
    public static class InvitationCardInfo {
        private String title;
        private int currentMembers;
        private int totalMembers;
        private String contestName;
        private String senderName;
        private Long postId;
        private Long invitationId;
    }

    public static ChatMessageResponse from(ChatMessage message, Long lastReadMessageId) {
        boolean read = lastReadMessageId != null && message.getId() <= lastReadMessageId;
        return ChatMessageResponse.builder()
                .messageId(message.getId())
                .senderId(message.getSender().getId())
                .senderNickname(message.getSender().getNickname())
                .content(message.getContent())
                .isRead(read)
                .isSystem(message.getMessageType() == MessageType.SYSTEM)
                .createdAt(message.getCreatedAt())
                .build();
    }
}
