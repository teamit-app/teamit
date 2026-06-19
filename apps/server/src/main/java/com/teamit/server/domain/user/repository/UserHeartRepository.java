package com.teamit.server.domain.user.repository;

import com.teamit.server.domain.user.entity.UserHeart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserHeartRepository extends JpaRepository<UserHeart, Long> {

    Optional<UserHeart> findByUserIdAndTargetUserId(Long userId, Long targetUserId);

    List<UserHeart> findAllByUserId(Long userId);

    boolean existsByUserIdAndTargetUserId(Long userId, Long targetUserId);
}
