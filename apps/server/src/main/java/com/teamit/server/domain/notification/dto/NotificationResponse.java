package com.teamit.server.domain.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamit.server.domain.notification.entity.Notification;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class NotificationResponse {
    private Long notificationId;
    private String type;
    private String title;
    private String body;
    @JsonProperty("isRead")
    private boolean isRead;
    private Long referenceId;
    private String referenceType;
    private String createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getId())
                .type(n.getType().name())
                .title(n.getTitle())
                .body(n.getBody())
                .isRead(n.isRead())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .createdAt(n.getCreatedAt() != null
                        ? n.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : null)
                .build();
    }
}
