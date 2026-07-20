package com.teamit.server.domain.user.repository;

import com.teamit.server.domain.user.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    @Query("SELECT us FROM UserSkill us LEFT JOIN FETCH us.skill WHERE us.user.id IN :userIds")
    List<UserSkill> findAllByUserIdInWithSkill(@Param("userIds") List<Long> userIds);

    void deleteAllByUserId(Long userId);
}
