package com.teamit.server.domain.education.service;

import com.teamit.server.domain.education.dto.EducationRequest;
import com.teamit.server.domain.education.dto.EducationResponse;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.repository.EducationRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EducationService {

    private final EducationRepository educationRepository;
    private final UserRepository userRepository;

    @Transactional
    public EducationResponse saveEducation(Long userId, EducationRequest request) {
        User user = userRepository.findById(userId).orElseThrow();

        Education education = Education.builder()
                .user(user)
                .schoolName(request.getSchoolName())
                .status(request.getStatus())
                .majorType(request.getMajorType())
                .major(request.getMajor())
                .subMajor(request.getSubMajor())
                .build();

        Education saved = educationRepository.save(education);

        return EducationResponse.builder()
                .educationId(saved.getId())
                .schoolName(saved.getSchoolName())
                .status(saved.getStatus())
                .major(saved.getMajor())
                .verified(saved.isVerified())
                .build();
    }
}
