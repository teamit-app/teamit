package com.teamit.server.domain.matching.entity;

import com.teamit.server.domain.chat.entity.ChatRoom;
import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "team_invitations")
public class TeamInvitation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    // HomeRepository native query: WHERE receiver_id = :userId AND status = 'PENDING'
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvitationStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    private ChatRoom chatRoom;

    @Builder
    public TeamInvitation(Post post, User sender, User receiver,
                          String message, InvitationStatus status, ChatRoom chatRoom) {
        this.post = post;
        this.sender = sender;
        this.receiver = receiver;
        this.message = message;
        this.status = status;
        this.chatRoom = chatRoom;
    }

    public void accept() { this.status = InvitationStatus.ACCEPTED; }
    public void reject() { this.status = InvitationStatus.REJECTED; }
}
