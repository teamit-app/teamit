package com.teamit.server.domain.notification.entity;

import com.teamit.server.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "notification_settings")
public class NotificationSettings {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "match_proposal", nullable = false)
    private boolean matchProposal;

    @Column(name = "proposal_response", nullable = false)
    private boolean proposalResponse;

    @Column(name = "deadline_alert", nullable = false)
    private boolean deadlineAlert;

    @Column(name = "message_alert", nullable = false)
    private boolean messageAlert;

    @Column(name = "match_success", nullable = false)
    private boolean matchSuccess;

    @Column(name = "announcement", nullable = false)
    private boolean announcement;

    @Builder
    public NotificationSettings(User user, boolean matchProposal, boolean proposalResponse,
                                 boolean deadlineAlert, boolean messageAlert,
                                 boolean matchSuccess, boolean announcement) {
        this.user = user;
        this.matchProposal = matchProposal;
        this.proposalResponse = proposalResponse;
        this.deadlineAlert = deadlineAlert;
        this.messageAlert = messageAlert;
        this.matchSuccess = matchSuccess;
        this.announcement = announcement;
    }

    public void update(Boolean matchProposal, Boolean proposalResponse, Boolean deadlineAlert,
                       Boolean messageAlert, Boolean matchSuccess, Boolean announcement) {
        if (matchProposal != null) this.matchProposal = matchProposal;
        if (proposalResponse != null) this.proposalResponse = proposalResponse;
        if (deadlineAlert != null) this.deadlineAlert = deadlineAlert;
        if (messageAlert != null) this.messageAlert = messageAlert;
        if (matchSuccess != null) this.matchSuccess = matchSuccess;
        if (announcement != null) this.announcement = announcement;
    }
}
