package com.teamit.server.global.security;

import com.teamit.server.domain.user.entity.Role;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/** 관리자 전용 API 접근을 제한한다. users.role이 ADMIN인 유저만 허용한다. */
@Component
@RequiredArgsConstructor
public class AdminAuthorizer {

    private final UserRepository userRepository;

    public void check(Long userId) {
        Role role = userRepository.findById(userId)
                .map(user -> user.getRole())
                .orElse(Role.USER);
        if (role != Role.ADMIN) {
            throw new AccessDeniedException("관리자만 접근할 수 있습니다");
        }
    }
}
