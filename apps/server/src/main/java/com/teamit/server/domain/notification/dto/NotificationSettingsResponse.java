package com.teamit.server.domain.notification.dto;

import com.teamit.server.domain.notification.entity.NotificationSettings;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationSettingsResponse {
    private boolean matchProposal;
    private boolean proposalResponse;
    private boolean deadlineAlert;
    private boolean messageAlert;
    private boolean matchSuccess;
    private boolean announcement;

    public static NotificationSettingsResponse from(NotificationSettings settings) {
        return NotificationSettingsResponse.builder()
                .matchProposal(settings.isMatchProposal())
                .proposalResponse(settings.isProposalResponse())
                .deadlineAlert(settings.isDeadlineAlert())
                .messageAlert(settings.isMessageAlert())
                .matchSuccess(settings.isMatchSuccess())
                .announcement(settings.isAnnouncement())
                .build();
    }
}
