package com.teamit.server.domain.notification.entity;

import com.teamit.server.domain.user.entity.User;
import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, columnDefinition = "VARCHAR(30)")
    private NotificationType type;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Builder
    public Notification(User user, NotificationType type, String title, String body,
                         Long referenceId, String referenceType) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.body = body;
        this.referenceId = referenceId;
        this.referenceType = referenceType;
        this.isRead = false;
    }
}
