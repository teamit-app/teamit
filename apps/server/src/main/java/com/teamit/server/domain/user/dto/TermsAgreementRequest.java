package com.teamit.server.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TermsAgreementRequest {

    private String termsVersion;
    private Boolean analyticsOptIn;
}
