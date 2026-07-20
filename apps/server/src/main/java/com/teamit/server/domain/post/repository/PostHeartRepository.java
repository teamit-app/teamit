package com.teamit.server.domain.post.repository;

import com.teamit.server.domain.post.entity.PostHeart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostHeartRepository extends JpaRepository<PostHeart, Long> {

    Optional<PostHeart> findByUserIdAndPostId(Long userId, Long postId);

    List<PostHeart> findAllByUserId(Long userId);

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    long countByPostId(Long postId);

    @Modifying
    @Query("DELETE FROM PostHeart h WHERE h.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);
}
