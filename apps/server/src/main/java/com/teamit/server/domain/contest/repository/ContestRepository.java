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

    List<Contest> findByEndDateGreaterThanEqualOrderByCreatedAtDesc(LocalDate today);

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
