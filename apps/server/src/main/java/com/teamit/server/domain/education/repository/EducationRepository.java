package com.teamit.server.domain.education.repository;

import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EducationRepository extends JpaRepository<Education, Long> {

    Optional<Education> findByUserId(Long userId);

    List<Education> findByUserIdIn(List<Long> userIds);

    boolean existsByUserId(Long userId);

    List<Education> findByVerificationStatus(VerificationStatus verificationStatus);

    @Modifying
    @Query("DELETE FROM Education e WHERE e.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
