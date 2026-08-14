package com.teamit.server.domain.post.repository;

import com.teamit.server.domain.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findByChatRoomId(Long chatRoomId);

    // 전체 모집글 목록(홈/탐색탭) — fetch join이 있는 쿼리는 count 자동 유도가 불안정해서
    // countQuery를 명시적으로 분리한다.
    @Query(value = "SELECT p FROM Post p JOIN FETCH p.owner",
            countQuery = "SELECT count(p) FROM Post p")
    Page<Post> findAllWithOwner(Pageable pageable);

    // owner(LAZY)를 목록 조회 시점에 함께 가져와서, 이후 owner 필드 접근(닉네임/성별 등)이
    // 게시글 건당 추가 쿼리를 발생시키지 않게 한다.
    @Query("SELECT p FROM Post p JOIN FETCH p.owner WHERE p.contestId = :contestId ORDER BY p.createdAt DESC")
    List<Post> findByContestIdOrderByCreatedAtDesc(@Param("contestId") Long contestId);

    @Query("SELECT p FROM Post p JOIN FETCH p.owner WHERE p.owner.id = :ownerId ORDER BY p.createdAt DESC")
    List<Post> findByOwnerIdOrderByCreatedAtDesc(@Param("ownerId") Long ownerId);

    List<Post> findByChatRoomIdIn(List<Long> chatRoomIds);

    Optional<Post> findByOwnerIdAndContestId(Long ownerId, Long contestId);
}
