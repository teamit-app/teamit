package com.teamit.server.domain.user.dto;

import com.teamit.server.domain.user.entity.Gender;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class OnboardingBasicRequest {

    private String nickname;
    private String name;
    private Gender gender;
    private LocalDate birthDate;
    private String termsVersion;
    private Boolean analyticsOptIn;
}
