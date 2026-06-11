package com.teamit.server.domain.region.repository;

import com.teamit.server.domain.region.entity.UserRegion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRegionRepository extends JpaRepository<UserRegion, Long> {

    void deleteAllByUserId(Long userId);

    List<UserRegion> findAllByUserId(Long userId);
}
