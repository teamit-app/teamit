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

    @Builder
    public Post(User owner, String title, String description, Long contestId,
                Integer recruitCount, String deadline,
                String onlineOffline, String genderCondition, String schoolCondition) {
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
    }

    public void close() {
        this.status = PostStatus.CLOSED;
    }
}
