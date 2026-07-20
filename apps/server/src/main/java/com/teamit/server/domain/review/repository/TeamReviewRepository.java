package com.teamit.server.domain.review.repository;

import com.teamit.server.domain.review.entity.TeamReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamReviewRepository extends JpaRepository<TeamReview, Long> {

    List<TeamReview> findByChatRoomIdAndReceiverId(Long chatRoomId, Long receiverId);

    List<TeamReview> findByChatRoomIdAndReviewerId(Long chatRoomId, Long reviewerId);

    List<TeamReview> findByReceiverId(Long receiverId);

    boolean existsByChatRoomIdAndReviewerIdAndReceiverId(Long chatRoomId, Long reviewerId, Long receiverId);

    // 채팅방 하드 삭제 전 참조만 끊는다(리뷰 레코드 자체는 삭제하지 않음) — ChatService.deleteChatRoom 참고.
    // 리뷰는 영구 평판 데이터로 계속 집계돼야 하므로 삭제하지 않는다.
    @Modifying
    @Query("UPDATE TeamReview r SET r.chatRoom = null WHERE r.chatRoom.id = :chatRoomId")
    void detachChatRoom(@Param("chatRoomId") Long chatRoomId);
}
