package com.teamit.server.domain.notification.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// PATCH 부분 수정용 — 넘어온 필드만 반영, 나머지는 null로 유지되어 무시된다
@Getter
@NoArgsConstructor
public class NotificationSettingsRequest {
    private Boolean matchProposal;
    private Boolean proposalResponse;
    private Boolean deadlineAlert;
    private Boolean messageAlert;
    private Boolean matchSuccess;
    private Boolean announcement;
}
