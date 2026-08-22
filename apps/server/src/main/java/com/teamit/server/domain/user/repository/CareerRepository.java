package com.teamit.server.domain.user.repository;

import com.teamit.server.domain.user.entity.Career;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CareerRepository extends JpaRepository<Career, Long> {

    List<Career> findAllByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM Career c WHERE c.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
