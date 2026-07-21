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

    // 카카오 고유 ID (OAuth 신규 가입 시 저장, 이후 온보딩으로 상세 정보 입력)
    @Column(name = "kakao_id", unique = true)
    private Long kakaoId;

    @Column(name = "nickname", length = 20, unique = true)
    private String nickname;

    // 온보딩 완료 전까지 null 허용
    @Column(name = "name", length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "is_matching_active", nullable = false)
    private Boolean isMatchingActive;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Builder
    public User(Long kakaoId, String nickname, String name, Gender gender, LocalDate birthDate,
                String profileImageUrl, Boolean isMatchingActive) {
        this.kakaoId = kakaoId;
        this.nickname = nickname;
        this.name = name;
        this.gender = gender;
        this.birthDate = birthDate;
        this.profileImageUrl = profileImageUrl;
        this.isMatchingActive = isMatchingActive != null ? isMatchingActive : false;
        this.role = Role.USER;
    }

    /** 온보딩 기본정보 저장/수정 */
    public void updateBasicInfo(String nickname, String name, Gender gender, LocalDate birthDate) {
        this.nickname = nickname;
        this.name = name;
        this.gender = gender;
        this.birthDate = birthDate;
    }

    /** 매칭 활성화 상태 변경 */
    public void setMatchingActive(boolean isMatchingActive) {
        this.isMatchingActive = isMatchingActive;
    }

    /** 프로필 사진 등록/변경 */
    public void updateProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
}
