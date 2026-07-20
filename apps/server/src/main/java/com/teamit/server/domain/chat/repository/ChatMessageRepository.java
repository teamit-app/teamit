package com.teamit.server.domain.chat.repository;

import com.teamit.server.domain.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 최신순 페이징
    Page<ChatMessage> findByChatRoomIdOrderByCreatedAtDesc(Long chatRoomId, Pageable pageable);

    // 나갔다가 재입장한 멤버는 이전(joinedAt 이전) 대화 내역을 볼 수 없어야 하므로
    // joinedAt 이후 메시지만 조회 — ChatService.getMessages 참고
    Page<ChatMessage> findByChatRoomIdAndCreatedAtAfterOrderByCreatedAtDesc(
            Long chatRoomId, LocalDateTime after, Pageable pageable);

    // 채팅방 마지막 메시지
    Optional<ChatMessage> findTopByChatRoomIdOrderByCreatedAtDesc(Long chatRoomId);

    // 채팅방 목록 미리보기용 — 조회자의 joinedAt 이후 메시지 중 마지막 것 (재입장 이전 내용 숨김)
    Optional<ChatMessage> findTopByChatRoomIdAndCreatedAtAfterOrderByCreatedAtDesc(Long chatRoomId, LocalDateTime after);

    // 전체 메시지 수 (lastReadMessageId가 null일 때 unreadCount로 사용)
    long countByChatRoomId(Long chatRoomId);

    // lastReadMessageId가 없을 때 unreadCount 계산용 — joinedAt 이후 메시지만 카운트
    long countByChatRoomIdAndCreatedAtAfter(Long chatRoomId, LocalDateTime after);

    // lastReadMessageId 이후 메시지 수 = 안 읽은 메시지 수
    long countByChatRoomIdAndIdGreaterThan(Long chatRoomId, Long lastReadMessageId);

    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.chatRoom.id = :chatRoomId")
    void deleteAllByChatRoomId(@Param("chatRoomId") Long chatRoomId);
}
