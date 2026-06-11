package com.teamit.server.domain.user.service;

import com.teamit.server.domain.user.dto.OnboardingBasicRequest;
import com.teamit.server.domain.user.dto.OnboardingBasicResponse;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public OnboardingBasicResponse saveBasicInfo(OnboardingBasicRequest request) {
        User user = User.builder()
                .nickname(request.getNickname())
                .name(request.getName())
                .gender(request.getGender())
                .birthDate(request.getBirthDate())
                .isMatchingActive(false)
                .build();

        User saved = userRepository.save(user);

        return OnboardingBasicResponse.builder()
                .userId(saved.getId())
                .nickname(saved.getNickname())
                .name(saved.getName())
                .gender(saved.getGender())
                .birthDate(saved.getBirthDate())
                .build();
    }
}
