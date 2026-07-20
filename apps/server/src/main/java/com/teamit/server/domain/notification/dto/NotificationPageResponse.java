package com.teamit.server.domain.notification.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class NotificationPageResponse {
    private List<NotificationResponse> content;
    private long unreadCount;
}
