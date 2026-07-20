package com.teamit.server.domain.post.repository;

import com.teamit.server.domain.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findByChatRoomId(Long chatRoomId);

    List<Post> findByContestIdOrderByCreatedAtDesc(Long contestId);

    List<Post> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Post> findByOwnerIdAndContestId(Long ownerId, Long contestId);
}
