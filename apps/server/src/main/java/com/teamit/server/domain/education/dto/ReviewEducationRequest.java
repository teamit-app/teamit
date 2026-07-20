package com.teamit.server.domain.education.dto;

import com.teamit.server.domain.education.entity.VerificationStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReviewEducationRequest {
    private VerificationStatus status;   // APPROVED | REJECTED
    private String rejectReason;         // REJECTED일 때만 사용
}
