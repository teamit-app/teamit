package com.teamit.server.domain.user.repository;

import com.teamit.server.domain.user.entity.Career;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CareerRepository extends JpaRepository<Career, Long> {

    List<Career> findAllByUserId(Long userId);
}
