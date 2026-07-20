package com.teamit.server.domain.education.repository;

import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EducationRepository extends JpaRepository<Education, Long> {

    Optional<Education> findByUserId(Long userId);

    List<Education> findByUserIdIn(List<Long> userIds);

    boolean existsByUserId(Long userId);

    List<Education> findByVerificationStatus(VerificationStatus verificationStatus);
}
