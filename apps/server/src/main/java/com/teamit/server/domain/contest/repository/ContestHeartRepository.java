package com.teamit.server.domain.contest.repository;

import com.teamit.server.domain.contest.entity.ContestHeart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContestHeartRepository extends JpaRepository<ContestHeart, Long> {

    Optional<ContestHeart> findByUserIdAndContestId(Long userId, Long contestId);

    List<ContestHeart> findAllByUserId(Long userId);

    boolean existsByUserIdAndContestId(Long userId, Long contestId);

    @Modifying
    @Query("DELETE FROM ContestHeart h WHERE h.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
