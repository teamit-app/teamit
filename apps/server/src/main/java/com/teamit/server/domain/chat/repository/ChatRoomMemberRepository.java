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

    @Query("SELECT m.chatRoom.id AS chatRoomId, COUNT(m) AS count FROM ChatRoomMember m WHERE m.chatRoom.id IN :chatRoomIds GROUP BY m.chatRoom.id")
    List<ChatRoomMemberCountProjection> countGroupedByChatRoomIdIn(@Param("chatRoomIds") List<Long> chatRoomIds);

    interface ChatRoomMemberCountProjection {
        Long getChatRoomId();
        Long getCount();
    }

    // 채팅방 목록(getChatRooms) 배치 조회용 — user까지 함께 fetch해서 방 멤버 표시(닉네임 등)에
    // 필요한 정보를 건당 추가 쿼리 없이 바로 쓸 수 있게 한다.
    @Query("SELECT m FROM ChatRoomMember m JOIN FETCH m.user WHERE m.chatRoom.id IN :chatRoomIds")
    List<ChatRoomMember> findByChatRoomIdIn(@Param("chatRoomIds") List<Long> chatRoomIds);

    // getChatRooms 배치 조회용 — user별 멤버십 리스트를 방(chatRoom)까지 한 번에 가져온다.
    @Query("SELECT m FROM ChatRoomMember m JOIN FETCH m.chatRoom WHERE m.user.id = :userId")
    List<ChatRoomMember> findByUserIdWithChatRoom(@Param("userId") Long userId);

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
