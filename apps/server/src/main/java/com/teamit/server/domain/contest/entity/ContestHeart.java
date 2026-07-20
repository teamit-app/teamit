package com.teamit.server.domain.contest.entity;

import com.teamit.server.domain.user.entity.User;
import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "contest_hearts", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "contest_id"})
})
public class ContestHeart extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @Builder
    public ContestHeart(User user, Contest contest) {
        this.user = user;
        this.contest = contest;
    }
}
