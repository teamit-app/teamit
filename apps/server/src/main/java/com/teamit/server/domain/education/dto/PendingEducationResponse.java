package com.teamit.server.domain.education.dto;

import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.entity.EducationDocType;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class PendingEducationResponse {

    private Long educationId;
    private Long userId;
    private String nickname;
    private String schoolName;
    private String major;
    private EducationDocType docType;
    private String submittedAt;

    public static PendingEducationResponse from(Education e) {
        return PendingEducationResponse.builder()
                .educationId(e.getId())
                .userId(e.getUser().getId())
                .nickname(e.getUser().getNickname())
                .schoolName(e.getSchoolName())
                .major(e.getMajor())
                .docType(e.getVerificationDocType())
                .submittedAt(e.getVerificationSubmittedAt() != null
                        ? e.getVerificationSubmittedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        : null)
                .build();
    }
}
