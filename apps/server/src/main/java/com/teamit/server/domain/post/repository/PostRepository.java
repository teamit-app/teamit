package com.teamit.server.domain.post.repository;

import com.teamit.server.domain.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByContestIdOrderByCreatedAtDesc(Long contestId);

    List<Post> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
