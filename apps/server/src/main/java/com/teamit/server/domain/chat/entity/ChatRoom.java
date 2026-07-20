package com.teamit.server.domain.chat.entity;

import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "chat_rooms")
public class ChatRoom extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false)
    private RoomType roomType;

    // GROUP 채팅방 이름 (DIRECT는 null)
    @Column(name = "team_name")
    private String teamName;

    @Builder
    public ChatRoom(RoomType roomType, String teamName) {
        this.roomType = roomType;
        this.teamName = teamName;
    }
}
