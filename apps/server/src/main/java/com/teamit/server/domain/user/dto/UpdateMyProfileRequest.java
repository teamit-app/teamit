package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.user.entity.Gender;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// 활동 가능 지역은 매칭 프로필(4단계)에서만 편집한다 — 기본정보 화면에서는 다루지 않는다.
@Getter
@NoArgsConstructor
public class UpdateMyProfileRequest {
    private String nickname;
    private String name;
    private Gender gender;
    private LocalDate birthDate;
}
