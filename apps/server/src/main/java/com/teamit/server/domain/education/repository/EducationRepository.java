package com.teamit.server.domain.education.repository;

import com.teamit.server.domain.education.entity.Education;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EducationRepository extends JpaRepository<Education, Long> {

    Optional<Education> findByUserId(Long userId);
}
