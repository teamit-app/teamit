package com.teamit.server.domain.post.entity;

import com.teamit.server.domain.user.entity.User;
import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "posts")
public class Post extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "contest_id")
    private Long contestId;

    @Column(name = "recruit_count")
    private Integer recruitCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PostStatus status;

    @Column(name = "deadline")
    private String deadline;

    @Column(name = "online_offline")
    private String onlineOffline;

    @Column(name = "gender_condition")
    private String genderCondition;

    @Column(name = "school_condition")
    private String schoolCondition;

    @Column(name = "experience_condition")
    private String experienceCondition;

    // 참여 목적 우대 조건("무관"/"경험 선호"/"수상 선호") — 하드필터가 아니라 소프트 스코어링 가산점에만 쓰인다
    @Column(name = "purpose_condition")
    private String purposeCondition;

    @Column(name = "chat_room_id")
    private Long chatRoomId;

    @Column(name = "team_confirmed", nullable = false)
    private boolean teamConfirmed = false;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Builder
    public Post(User owner, String title, String description, Long contestId,
                Integer recruitCount, String deadline,
                String onlineOffline, String genderCondition, String schoolCondition,
                String experienceCondition, String purposeCondition) {
        this.owner = owner;
        this.title = title;
        this.description = description;
        this.contestId = contestId;
        this.recruitCount = recruitCount;
        this.status = PostStatus.OPEN;
        this.deadline = deadline;
        this.onlineOffline = onlineOffline;
        this.genderCondition = genderCondition;
        this.schoolCondition = schoolCondition;
        this.experienceCondition = experienceCondition;
        this.purposeCondition = purposeCondition;
    }

    public void assignChatRoom(Long chatRoomId) {
        this.chatRoomId = chatRoomId;
    }

    // 팀원을 확정하면 모집이 끝난 것이므로 모집글도 함께 마감 처리한다 — 더 이상
    // 지원·초대를 받지 않아야 하고, 목록에도 마감으로 표시돼야 함
    public void confirmTeam() {
        this.teamConfirmed = true;
        this.status = PostStatus.CLOSED;
    }

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void close() {
        this.status = PostStatus.CLOSED;
    }

    public void update(String title, String description) {
        if (title != null && !title.isBlank()) this.title = title;
        if (description != null) this.description = description;
    }

    // 아직 합류한 팀원이 없을 때만 호출됨(PostService.updatePost 참고) — 모집 조건 전체를 재설정한다
    public void updateFull(String title, String description, Integer recruitCount,
                            String onlineOffline, String genderCondition,
                            String schoolCondition, String experienceCondition,
                            String purposeCondition) {
        update(title, description);
        if (recruitCount != null) this.recruitCount = recruitCount;
        if (onlineOffline != null) this.onlineOffline = onlineOffline;
        if (genderCondition != null) this.genderCondition = genderCondition;
        if (schoolCondition != null) this.schoolCondition = schoolCondition;
        if (experienceCondition != null) this.experienceCondition = experienceCondition;
        if (purposeCondition != null) this.purposeCondition = purposeCondition;
    }
}
