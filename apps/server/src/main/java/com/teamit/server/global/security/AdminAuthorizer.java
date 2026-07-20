package com.teamit.server.global.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/** 관리자 전용 API 접근을 제한한다. 지금은 유저 역할 체계가 없어 특정 user-id 하나만 허용한다. */
@Component
public class AdminAuthorizer {

    private final Long adminUserId;

    public AdminAuthorizer(@Value("${admin.user-id}") Long adminUserId) {
        this.adminUserId = adminUserId;
    }

    public void check(Long userId) {
        if (!adminUserId.equals(userId)) {
            throw new AccessDeniedException("관리자만 접근할 수 있습니다");
        }
    }
}
