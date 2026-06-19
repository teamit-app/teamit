package com.teamit.server.domain.matching.entity;

import com.teamit.server.domain.chat.entity.ChatRoom;
import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "post_applications")
public class PostApplication extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // HomeRepository native query: WHERE user_id = :userId
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User applicant;

    @Column(name = "appeal_text", columnDefinition = "TEXT")
    private String appealText;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApplicationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    private ChatRoom chatRoom;

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned;

    @Column(name = "pinned_at")
    private LocalDateTime pinnedAt;

    @Builder
    public PostApplication(Post post, User applicant, String appealText,
                           ApplicationStatus status, ChatRoom chatRoom) {
        this.post = post;
        this.applicant = applicant;
        this.appealText = appealText;
        this.status = status;
        this.chatRoom = chatRoom;
        this.isPinned = false;
    }

    public void accept() { this.status = ApplicationStatus.ACCEPTED; }
    public void reject() { this.status = ApplicationStatus.REJECTED; }

    public void pin() {
        this.isPinned = true;
        this.pinnedAt = LocalDateTime.now();
    }

    public void unpin() {
        this.isPinned = false;
        this.pinnedAt = null;
    }
}
