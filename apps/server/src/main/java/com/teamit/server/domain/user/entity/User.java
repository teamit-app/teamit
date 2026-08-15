package com.teamit.server.domain.user.entity;

import com.teamit.server.global.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

    // 가입 시 필수 동의(이용약관·개인정보 수집이용) 시각과 그 시점의 약관 버전.
    // 항목별 상세 이력은 남기지 않고, 베타 규모에 맞춰 최소한으로만 기록한다.
    @Column(name = "terms_agreed_at")
    private LocalDateTime termsAgreedAt;

    @Column(name = "terms_version", length = 20)
    private String termsVersion;

    // 서비스 이용기록·기기정보(GA4/GTM/Clarity) 수집 선택 동의 여부
    @Column(name = "analytics_opt_in", nullable = false)
    private Boolean analyticsOptIn = false;

    @Builder
    public User(Long kakaoId, String nickname, String name, Gender gender, LocalDate birthDate,
                String profileImageUrl, Boolean isMatchingActive) {
        this.kakaoId = kakaoId;
        this.nickname = nickname;
        this.name = name;
        this.gender = gender;
        this.birthDate = birthDate;
        this.profileImageUrl = profileImageUrl;
        this.isMatchingActive = isMatchingActive != null ? isMatchingActive : true;
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

    /** 가입 시 필수 동의 처리 (온보딩 기본정보 저장과 함께 호출) */
    public void agreeToTerms(String termsVersion, boolean analyticsOptIn) {
        this.termsAgreedAt = LocalDateTime.now();
        this.termsVersion = termsVersion;
        this.analyticsOptIn = analyticsOptIn;
    }

    /** 프로필 사진 등록/변경 */
    public void updateProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
}
