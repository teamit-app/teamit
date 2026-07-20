package com.teamit.server.domain.education.dto;

import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.entity.VerificationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class EducationVerificationResponse {

    private VerificationStatus status;
    private String submittedAt;

    public static EducationVerificationResponse from(Education education) {
        return EducationVerificationResponse.builder()
                .status(education.getEffectiveVerificationStatus())
                .submittedAt(education.getVerificationSubmittedAt() != null
                        ? education.getVerificationSubmittedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        : null)
                .build();
    }
}
