package com.teamit.server.domain.education.dto;

import com.teamit.server.domain.education.entity.EducationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationResponse {

    private Long educationId;
    private String schoolName;
    private EducationStatus status;
    private String major;
    private boolean verified;
}
