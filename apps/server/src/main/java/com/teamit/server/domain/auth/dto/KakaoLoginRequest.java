package com.teamit.server.domain.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KakaoLoginRequest {
    private String kakaoAccessToken;
}
