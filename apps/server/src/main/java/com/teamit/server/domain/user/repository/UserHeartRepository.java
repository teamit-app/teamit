package com.teamit.server.domain.user.repository;

import com.teamit.server.domain.user.entity.UserHeart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserHeartRepository extends JpaRepository<UserHeart, Long> {

    Optional<UserHeart> findByUserIdAndTargetUserId(Long userId, Long targetUserId);

    List<UserHeart> findAllByUserId(Long userId);

    boolean existsByUserIdAndTargetUserId(Long userId, Long targetUserId);

    @Modifying
    @Query("DELETE FROM UserHeart h WHERE h.user.id = :userId OR h.targetUser.id = :userId")
    void deleteAllByUserIdOrTargetUserId(@Param("userId") Long userId);
}
