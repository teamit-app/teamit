package com.teamit.server.domain.user.repository;

import com.teamit.server.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByKakaoId(Long kakaoId);

    Optional<User> findByNickname(String nickname);

    @Query(value = "SELECT DISTINCT u FROM User u " +
            "LEFT JOIN UserSkill us ON us.user = u " +
            "LEFT JOIN us.skill s " +
            "LEFT JOIN UserRegion r ON r.user = u " +
            "WHERE u.name IS NOT NULL " +
            "AND u.isMatchingActive = true " +
            "AND (:skillId IS NULL OR us.skill.id = :skillId) " +
            "AND (:sido IS NULL OR r.sido = :sido) " +
            "AND (:keyword IS NULL OR " +
            "     LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(us.skillNameCustom) LIKE LOWER(CONCAT('%', :keyword, '%')))",
            countQuery = "SELECT COUNT(DISTINCT u) FROM User u " +
            "LEFT JOIN UserSkill us ON us.user = u " +
            "LEFT JOIN us.skill s " +
            "LEFT JOIN UserRegion r ON r.user = u " +
            "WHERE u.name IS NOT NULL " +
            "AND u.isMatchingActive = true " +
            "AND (:skillId IS NULL OR us.skill.id = :skillId) " +
            "AND (:sido IS NULL OR r.sido = :sido) " +
            "AND (:keyword IS NULL OR " +
            "     LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(us.skillNameCustom) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findUserPool(@Param("skillId") Long skillId,
                            @Param("sido") String sido,
                            @Param("keyword") String keyword,
                            Pageable pageable);
}
