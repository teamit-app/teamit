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

    // 탐색 탭 공모전 목록의 "인기순" 정렬용 — 목록 건마다 따로 조회하면 N+1이라
    // 한 번에 배치로 가져온다(PostHeartRepository.countGroupedByPostIdIn과 동일 패턴)
    @Query("SELECT h.contest.id AS contestId, COUNT(h) AS count FROM ContestHeart h WHERE h.contest.id IN :contestIds GROUP BY h.contest.id")
    List<ContestHeartCountProjection> countGroupedByContestIdIn(@Param("contestIds") List<Long> contestIds);

    interface ContestHeartCountProjection {
        Long getContestId();
        Long getCount();
    }
}
