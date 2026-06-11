package com.teamit.server.domain.user.entity;

import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "nickname", nullable = false, length = 20)
    private String nickname;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false)
    private Gender gender;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "is_matching_active", nullable = false)
    private Boolean isMatchingActive;

    @Builder
    public User(String nickname, String name, Gender gender, LocalDate birthDate,
                String profileImageUrl, Boolean isMatchingActive) {
        this.nickname = nickname;
        this.name = name;
        this.gender = gender;
        this.birthDate = birthDate;
        this.profileImageUrl = profileImageUrl;
        this.isMatchingActive = isMatchingActive != null ? isMatchingActive : false;
    }
}
