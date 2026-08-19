package com.teamit.server.domain.contest.repository;

import com.teamit.server.domain.contest.entity.Contest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ContestRepository extends JpaRepository<Contest, Long> {

    // "인기 공모전" 판단 기준 — 좋아요(하트) 많은 순. 하트 수가 같으면 최신순으로 tie-break.
    // ContestHeart를 LEFT JOIN해서 하트가 하나도 없는 공모전(COUNT(h)=0)도 후보에 포함시킨다.
    @Query("SELECT c FROM Contest c LEFT JOIN ContestHeart h ON h.contest = c " +
            "WHERE c.endDate >= :today " +
            "GROUP BY c " +
            "ORDER BY COUNT(h) DESC, c.createdAt DESC")
    List<Contest> findMostHeartedActiveContests(@Param("today") LocalDate today, Pageable pageable);

    // 관리자 공모전 관리 화면용 전체 목록
    List<Contest> findAllByOrderByIdDesc();

    // category: enum name string, null means no filter
    // statusEndMin / statusEndMax / statusEndBefore: date range for status filter, null means no filter
    // keyword: LIKE search on title, organizer, category column
    @Query(value = "SELECT * FROM contests c " +
            "WHERE (:category IS NULL OR c.category = :category) " +
            "AND (:statusEndMin IS NULL OR c.end_date >= :statusEndMin) " +
            "AND (:statusEndMax IS NULL OR c.end_date <= :statusEndMax) " +
            "AND (:statusEndBefore IS NULL OR c.end_date < :statusEndBefore) " +
            "AND (:keyword IS NULL OR " +
            "     c.title LIKE CONCAT('%', :keyword, '%') OR " +
            "     c.organizer LIKE CONCAT('%', :keyword, '%') OR " +
            "     c.category LIKE CONCAT('%', :keyword, '%')) " +
            "ORDER BY c.created_at DESC",
            countQuery = "SELECT COUNT(*) FROM contests c " +
            "WHERE (:category IS NULL OR c.category = :category) " +
            "AND (:statusEndMin IS NULL OR c.end_date >= :statusEndMin) " +
            "AND (:statusEndMax IS NULL OR c.end_date <= :statusEndMax) " +
            "AND (:statusEndBefore IS NULL OR c.end_date < :statusEndBefore) " +
            "AND (:keyword IS NULL OR " +
            "     c.title LIKE CONCAT('%', :keyword, '%') OR " +
            "     c.organizer LIKE CONCAT('%', :keyword, '%') OR " +
            "     c.category LIKE CONCAT('%', :keyword, '%'))",
            nativeQuery = true)
    Page<Contest> findContestList(@Param("category") String category,
                                  @Param("statusEndMin") LocalDate statusEndMin,
                                  @Param("statusEndMax") LocalDate statusEndMax,
                                  @Param("statusEndBefore") LocalDate statusEndBefore,
                                  @Param("keyword") String keyword,
                                  Pageable pageable);
}
