package com.teamit.server.domain.chat.repository;

import com.teamit.server.domain.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 최신순 페이징
    Page<ChatMessage> findByChatRoomIdOrderByCreatedAtDesc(Long chatRoomId, Pageable pageable);

    // 채팅방 마지막 메시지
    Optional<ChatMessage> findTopByChatRoomIdOrderByCreatedAtDesc(Long chatRoomId);

    // 전체 메시지 수 (lastReadMessageId가 null일 때 unreadCount로 사용)
    long countByChatRoomId(Long chatRoomId);

    // lastReadMessageId 이후 메시지 수 = 안 읽은 메시지 수
    long countByChatRoomIdAndIdGreaterThan(Long chatRoomId, Long lastReadMessageId);
}
