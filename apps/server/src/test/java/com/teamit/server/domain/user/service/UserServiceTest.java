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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
        OnboardingBasicRequest request = new OnboardingBasicRequest();
        request.setNickname("김티밋");
        request.setName("김민준");
        request.setGender(Gender.MALE);
        request.setBirthDate(LocalDate.of(2002, 5, 11));

        User savedUser = User.builder()
                .nickname("김티밋")
                .name("김민준")
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(2002, 5, 11))
                .isMatchingActive(false)
                .build();

        given(userRepository.save(any(User.class))).willReturn(savedUser);

        // when
        OnboardingBasicResponse response = userService.saveBasicInfo(request);

        // then
        assertThat(response.getNickname()).isEqualTo("김티밋");
        assertThat(response.getName()).isEqualTo("김민준");
        assertThat(response.getGender()).isEqualTo(Gender.MALE);
        assertThat(response.getBirthDate()).isEqualTo(LocalDate.of(2002, 5, 11));
    }

    @Test
    void 기본정보_저장_닉네임_null이면_예외() {
        // given
        OnboardingBasicRequest request = new OnboardingBasicRequest();
        request.setNickname(null);
        request.setName("김민준");
        request.setGender(Gender.MALE);
        request.setBirthDate(LocalDate.of(2002, 5, 11));

        given(userRepository.save(any(User.class)))
                .willThrow(new IllegalArgumentException("닉네임은 필수입니다"));

        // when & then
        assertThatThrownBy(() -> userService.saveBasicInfo(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("닉네임은 필수입니다");
    }
}
