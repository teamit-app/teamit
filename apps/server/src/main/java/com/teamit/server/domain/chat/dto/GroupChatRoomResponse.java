package com.teamit.server.domain.chat.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GroupChatRoomResponse {
    private Long chatRoomId;
    private String roomType;
    private String teamName;
    private long memberCount;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
