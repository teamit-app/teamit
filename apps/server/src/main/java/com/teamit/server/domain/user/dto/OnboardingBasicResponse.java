package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.user.entity.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingBasicResponse {

    private Long userId;
    private String nickname;
    private String name;
    private Gender gender;
    private LocalDate birthDate;
}
