package com.teamit.server.domain.contest.repository;

import com.teamit.server.domain.contest.entity.ContestParticipant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, Long> {

    boolean existsByContestIdAndUserId(Long contestId, Long userId);

    java.util.Optional<ContestParticipant> findByContestIdAndUserId(Long contestId, Long userId);

    java.util.List<ContestParticipant> findAllByUserId(Long userId);

    java.util.Optional<ContestParticipant> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    long countByContestIdAndUserIdNot(Long contestId, Long userId);

    void deleteByContestIdAndUserId(Long contestId, Long userId);

    @Query("SELECT cp FROM ContestParticipant cp WHERE cp.contest.id = :contestId AND cp.user.id <> :excludeUserId")
    List<ContestParticipant> findCandidates(@Param("contestId") Long contestId, @Param("excludeUserId") Long excludeUserId);

    // "전체 후보" 목록용 — 하드필터·스코어링 없이 이 공모전에 등록된 모든 후보를 페이징으로
    @Query("SELECT cp FROM ContestParticipant cp WHERE cp.contest.id = :contestId AND cp.user.id <> :excludeUserId ORDER BY cp.createdAt DESC")
    Page<ContestParticipant> findAllCandidatesPaged(@Param("contestId") Long contestId, @Param("excludeUserId") Long excludeUserId, Pageable pageable);
}
