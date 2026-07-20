package com.teamit.server.domain.chat.entity;

import com.teamit.server.domain.user.entity.User;
import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "chat_messages")
public class ChatMessage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    // null(레거시 데이터) = TEXT로 취급
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", columnDefinition = "VARCHAR(20)")
    private MessageType messageType;

    // INVITATION_CARD 타입일 때 TeamInvitation.id를 가리킴
    @Column(name = "reference_id")
    private Long referenceId;

    @Builder
    public ChatMessage(ChatRoom chatRoom, User sender, String content,
                       MessageType messageType, Long referenceId) {
        this.chatRoom = chatRoom;
        this.sender = sender;
        this.content = content;
        this.messageType = messageType;
        this.referenceId = referenceId;
    }

    public static ChatMessage text(ChatRoom chatRoom, User sender, String content) {
        return new ChatMessage(chatRoom, sender, content, MessageType.TEXT, null);
    }

    public static ChatMessage system(ChatRoom chatRoom, User actor, String content) {
        return new ChatMessage(chatRoom, actor, content, MessageType.SYSTEM, null);
    }

    public static ChatMessage invitationCard(ChatRoom chatRoom, User sender, String fallbackContent, Long invitationId) {
        return new ChatMessage(chatRoom, sender, fallbackContent, MessageType.INVITATION_CARD, invitationId);
    }
}
