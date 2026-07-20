package com.teamit.server.domain.education.service;

import com.teamit.server.domain.education.dto.EducationRequest;
import com.teamit.server.domain.education.dto.EducationResponse;
import com.teamit.server.domain.education.dto.EducationVerificationResponse;
import com.teamit.server.domain.education.dto.PendingEducationResponse;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.entity.EducationDocType;
import com.teamit.server.domain.education.entity.VerificationStatus;
import com.teamit.server.domain.education.repository.EducationRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import com.teamit.server.global.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EducationService {

    private static final String VERIFICATION_SUB_DIR = "education-verification";

    private final EducationRepository educationRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public EducationResponse saveEducation(Long userId, EducationRequest request) {
        Education saved = educationRepository.findByUserId(userId)
                .map(existing -> {
                    existing.updateInfo(request.getSchoolName(), request.getStatus(),
                            request.getMajorType(), request.getMajor(), request.getSubMajor());
                    return existing;
                })
                .orElseGet(() -> {
                    User user = userRepository.findById(userId).orElseThrow();
                    return educationRepository.save(Education.builder()
                            .user(user)
                            .schoolName(request.getSchoolName())
                            .status(request.getStatus())
                            .majorType(request.getMajorType())
                            .major(request.getMajor())
                            .subMajor(request.getSubMajor())
                            .build());
                });

        return EducationResponse.builder()
                .educationId(saved.getId())
                .schoolName(saved.getSchoolName())
                .status(saved.getStatus())
                .major(saved.getMajor())
                .verified(saved.isVerified())
                .build();
    }

    @Transactional
    public EducationVerificationResponse submitVerification(Long userId, Long educationId,
                                                              EducationDocType docType, MultipartFile file) {
        Education education = educationRepository.findById(educationId)
                .filter(e -> e.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("학력 정보를 찾을 수 없습니다"));
        String storedFileName = fileStorageService.store(file, VERIFICATION_SUB_DIR);
        education.submitVerification(docType, storedFileName);
        return EducationVerificationResponse.from(education);
    }

    @Transactional
    public void cancelVerification(Long userId, Long educationId) {
        educationRepository.findById(educationId)
                .filter(e -> e.getUser().getId().equals(userId))
                .ifPresent(Education::cancelVerification);
    }

    // ──────────────────────────────────────────────────────────────
    // 관리자: 학력 인증 심사
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PendingEducationResponse> getPendingVerifications() {
        return educationRepository.findByVerificationStatus(VerificationStatus.PENDING).stream()
                .map(PendingEducationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Resource loadVerificationFile(Long educationId) {
        Education education = educationRepository.findById(educationId)
                .orElseThrow(() -> new IllegalArgumentException("학력 정보를 찾을 수 없습니다"));
        if (education.getVerificationFileName() == null) {
            throw new IllegalArgumentException("제출된 서류가 없습니다");
        }
        return fileStorageService.load(VERIFICATION_SUB_DIR, education.getVerificationFileName());
    }

    @Transactional
    public void reviewVerification(Long educationId, VerificationStatus status, String rejectReason) {
        Education education = educationRepository.findById(educationId)
                .orElseThrow(() -> new IllegalArgumentException("학력 정보를 찾을 수 없습니다"));
        if (status == VerificationStatus.APPROVED) {
            education.approve();
        } else if (status == VerificationStatus.REJECTED) {
            education.reject(rejectReason);
        } else {
            throw new IllegalArgumentException("APPROVED 또는 REJECTED만 가능합니다");
        }
    }
}
