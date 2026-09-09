package com.teamit.server.domain.contest.repository;

import com.teamit.server.domain.contest.entity.Contest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ContestRepository extends JpaRepository<Contest, Long>, JpaSpecificationExecutor<Contest> {

    // "인기 공모전" 판단 기준 — 좋아요(하트) 많은 순. 하트 수가 같으면 최신순으로 tie-break.
    // ContestHeart를 LEFT JOIN해서 하트가 하나도 없는 공모전(COUNT(h)=0)도 후보에 포함시킨다.
    @Query("SELECT c FROM Contest c LEFT JOIN ContestHeart h ON h.contest = c " +
            "WHERE c.endDate >= :today " +
            "GROUP BY c " +
            "ORDER BY COUNT(h) DESC, c.createdAt DESC")
    List<Contest> findMostHeartedActiveContests(@Param("today") LocalDate today, Pageable pageable);

    // getContestDetail이 @Cacheable이라 엔티티를 읽어서 dirty-check로 증가시키는 방식은 캐시 히트 시
    // 반영되지 않는다 — 캐시 여부와 무관하게 항상 실행되도록 원자적 UPDATE로 처리한다(Post.increaseViewCount와 대비).
    @Modifying
    @Query("UPDATE Contest c SET c.viewCount = c.viewCount + 1 WHERE c.id = :contestId")
    void increaseViewCount(@Param("contestId") Long contestId);

    // 관리자 공모전 관리 화면용 전체 목록 — 페이징 필요(별도 처리 예정, 지금은 그대로 둠)
    List<Contest> findAllByOrderByIdDesc();

    // 필터 조합 검색은 ContestSpecifications + JpaSpecificationExecutor.findAll(spec, pageable)로 처리한다
    // (예전엔 여기 네이티브 @Query로 "(:param IS NULL OR ...)" 패턴을 썼는데, 그게 매 요청 풀스캔의
    // 원인이었다 — ContestService.getContestList / ContestSpecifications 참고).
}
