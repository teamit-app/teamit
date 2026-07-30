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

    // 모집글 목록(getPostsByContest/getMyPosts) 배치 조회용 — 한쪽은 contestId 고정+userId 다양,
    // 다른 한쪽은 userId 고정+contestId 다양이라 양쪽 IN절을 모두 받아 한 번에 커버한다.
    @Query("SELECT cp FROM ContestParticipant cp WHERE cp.contest.id IN :contestIds AND cp.user.id IN :userIds")
    List<ContestParticipant> findAllByContestIdInAndUserIdIn(
            @Param("contestIds") List<Long> contestIds, @Param("userIds") List<Long> userIds);

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
