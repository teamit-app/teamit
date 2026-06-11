package com.teamit.server.domain.education.dto;

import com.teamit.server.domain.education.entity.EducationStatus;
import com.teamit.server.domain.education.entity.MajorType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EducationRequest {

    private String schoolName;
    private EducationStatus status;
    private MajorType majorType;
    private String major;
    private String subMajor;
}
