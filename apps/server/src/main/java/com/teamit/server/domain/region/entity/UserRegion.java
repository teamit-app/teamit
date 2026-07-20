package com.teamit.server.domain.region.entity;

import com.teamit.server.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "user_region")
public class UserRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "sido", nullable = false, length = 50)
    private String sido;

    @Column(name = "sigungu", length = 50)
    private String sigungu;

    @Builder
    public UserRegion(User user, String sido, String sigungu) {
        this.user = user;
        this.sido = sido;
        this.sigungu = sigungu;
    }
}
