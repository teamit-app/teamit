package com.teamit.server.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KakaoLoginResponse {
    private String accessToken;
    private String refreshToken;

    @JsonProperty("isNewUser")
    private boolean isNewUser;

    private Long userId;
}
