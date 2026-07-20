package com.teamit.server.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class AddCertificateCareerRequest {
    private String certName;
    private String issuingOrg;
    private LocalDate acquiredDate;
}
