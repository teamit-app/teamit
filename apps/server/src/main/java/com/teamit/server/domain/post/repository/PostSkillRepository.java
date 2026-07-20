package com.teamit.server.domain.post.repository;

import com.teamit.server.domain.post.entity.PostSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostSkillRepository extends JpaRepository<PostSkill, Long> {

    @Query("SELECT ps FROM PostSkill ps LEFT JOIN FETCH ps.skill WHERE ps.post.id = :postId")
    List<PostSkill> findAllByPostIdWithSkill(@Param("postId") Long postId);

    @Modifying
    @Query("DELETE FROM PostSkill s WHERE s.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);
}
