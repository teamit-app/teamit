package com.teamit.server.domain.education.service;

import com.teamit.server.domain.education.dto.EducationRequest;
import com.teamit.server.domain.education.dto.EducationResponse;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.entity.EducationStatus;
import com.teamit.server.domain.education.entity.MajorType;
import com.teamit.server.domain.education.repository.EducationRepository;
import com.teamit.server.domain.user.entity.Gender;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class EducationServiceTest {

    @Mock
    private EducationRepository educationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EducationService educationService;

    @Test
    void 학력_저장_성공() {
        // given
        Long userId = 1L;

        User user = User.builder()
                .nickname("김티밋")
                .name("김민준")
                .gender(Gender.MALE)
                .birthDate(LocalDate.of(2002, 5, 11))
                .isMatchingActive(false)
                .build();

        EducationRequest request = new EducationRequest();
        request.setSchoolName("연세대학교");
        request.setStatus(EducationStatus.ATTENDING);
        request.setMajorType(MajorType.SINGLE);
        request.setMajor("컴퓨터공학과");
        request.setSubMajor(null);

        Education savedEducation = Education.builder()
                .user(user)
                .schoolName("연세대학교")
                .status(EducationStatus.ATTENDING)
                .majorType(MajorType.SINGLE)
                .major("컴퓨터공학과")
                .build();

        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(educationRepository.save(any(Education.class))).willReturn(savedEducation);

        // when
        EducationResponse response = educationService.saveEducation(userId, request);

        // then
        assertThat(response.getSchoolName()).isEqualTo("연세대학교");
        assertThat(response.getStatus()).isEqualTo(EducationStatus.ATTENDING);
        assertThat(response.getMajor()).isEqualTo("컴퓨터공학과");
        assertThat(response.isVerified()).isFalse();
    }

    @Test
    void 학력_저장_존재하지_않는_userId면_예외() {
        // given
        Long userId = 999L;

        EducationRequest request = new EducationRequest();
        request.setSchoolName("연세대학교");
        request.setStatus(EducationStatus.ATTENDING);
        request.setMajorType(MajorType.SINGLE);
        request.setMajor("컴퓨터공학과");

        given(userRepository.findById(userId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> educationService.saveEducation(userId, request))
                .isInstanceOf(NoSuchElementException.class);
    }
}
