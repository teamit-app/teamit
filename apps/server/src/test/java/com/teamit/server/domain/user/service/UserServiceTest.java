package com.teamit.server.domain.user.service;

import com.teamit.server.domain.user.dto.OnboardingBasicRequest;
import com.teamit.server.domain.user.dto.OnboardingBasicResponse;
import com.teamit.server.domain.user.entity.Gender;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void 기본정보_저장_성공() {
        // given
        Long userId = 1L;
        OnboardingBasicRequest request = new OnboardingBasicRequest();
        request.setNickname("김티밋");
        request.setName("김민준");
        request.setGender(Gender.MALE);
        request.setBirthDate(LocalDate.of(2002, 5, 11));

        User existingUser = User.builder()
                .nickname("이전닉네임")
                .isMatchingActive(false)
                .build();

        given(userRepository.findById(userId)).willReturn(Optional.of(existingUser));

        // when
        OnboardingBasicResponse response = userService.saveBasicInfo(userId, request);

        // then
        assertThat(response.getNickname()).isEqualTo("김티밋");
        assertThat(response.getName()).isEqualTo("김민준");
        assertThat(response.getGender()).isEqualTo(Gender.MALE);
        assertThat(response.getBirthDate()).isEqualTo(LocalDate.of(2002, 5, 11));
    }

    @Test
    void 기본정보_저장_사용자_없으면_예외() {
        // given
        Long userId = 1L;
        OnboardingBasicRequest request = new OnboardingBasicRequest();
        request.setNickname("김티밋");
        request.setName("김민준");
        request.setGender(Gender.MALE);
        request.setBirthDate(LocalDate.of(2002, 5, 11));

        given(userRepository.findById(userId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.saveBasicInfo(userId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("사용자를 찾을 수 없습니다");
    }
}
