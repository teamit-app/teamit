package com.teamit.server.domain.contest.repository;

import com.teamit.server.domain.contest.entity.Contest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ContestRepository extends JpaRepository<Contest, Long> {
    List<Contest> findByEndDateGreaterThanEqualOrderByCreatedAtDesc(LocalDate today);
}
