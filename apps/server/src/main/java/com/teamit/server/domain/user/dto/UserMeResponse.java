package com.teamit.server.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserMeResponse {
    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private boolean needsOnboarding;
}
