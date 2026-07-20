package com.teamit.server.domain.chat.repository;

import com.teamit.server.domain.chat.entity.ChatRoomMember;
import com.teamit.server.domain.chat.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    List<ChatRoomMember> findByUserId(Long userId);

    List<ChatRoomMember> findByChatRoomId(Long chatRoomId);

    Optional<ChatRoomMember> findByUserIdAndChatRoomId(Long userId, Long chatRoomId);

    long countByChatRoomId(Long chatRoomId);

    @Modifying
    @Query("DELETE FROM ChatRoomMember m WHERE m.chatRoom.id = :chatRoomId")
    void deleteAllByChatRoomId(@Param("chatRoomId") Long chatRoomId);

    // 두 유저가 함께 속한 DIRECT 채팅방 ID 조회 (이미 채팅방이 있으면 재사용)
    @Query("""
            SELECT m1.chatRoom.id FROM ChatRoomMember m1
            JOIN ChatRoomMember m2 ON m2.chatRoom = m1.chatRoom
            WHERE m1.user.id = :userId1
              AND m2.user.id = :userId2
              AND m1.chatRoom.roomType = :roomType
            """)
    Optional<Long> findDirectChatRoomId(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            @Param("roomType") RoomType roomType);
}
