package com.teamit.server.domain.user.repository;

import com.teamit.server.domain.user.entity.MatchingProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatchingProfileRepository extends JpaRepository<MatchingProfile, Long> {

    Optional<MatchingProfile> findByUserId(Long userId);

    List<MatchingProfile> findAllByUserIdIn(List<Long> userIds);
}
