package com.teamit.server.domain.review.entity;

import com.teamit.server.domain.chat.entity.ChatRoom;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "team_reviews", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"chat_room_id", "reviewer_id", "receiver_id"})
})
public class TeamReview extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // 채팅방이 삭제돼도 리뷰(영구 평판 데이터)는 남아야 하므로 nullable — 삭제 시
    // 참조만 detach된다(하드 삭제하지 않음). ChatService.deleteChatRoom 참고
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(name = "total_rating", nullable = false)
    private Integer totalRating;

    @Column(name = "response_speed", nullable = false)
    private String responseSpeed;

    @Column(name = "deadline_completion", nullable = false)
    private String deadlineCompletion;

    @Column(name = "participation_intensity", nullable = false)
    private String participationIntensity;

    @ElementCollection
    @CollectionTable(name = "team_review_keywords", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "keyword")
    private List<String> keywords = new ArrayList<>();

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Builder
    public TeamReview(ChatRoom chatRoom, User reviewer, User receiver, Integer totalRating,
                       String responseSpeed, String deadlineCompletion, String participationIntensity,
                       List<String> keywords, String comment) {
        this.chatRoom = chatRoom;
        this.reviewer = reviewer;
        this.receiver = receiver;
        this.totalRating = totalRating;
        this.responseSpeed = responseSpeed;
        this.deadlineCompletion = deadlineCompletion;
        this.participationIntensity = participationIntensity;
        this.keywords = keywords != null ? keywords : new ArrayList<>();
        this.comment = comment;
    }
}
