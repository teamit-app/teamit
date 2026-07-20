package com.teamit.server.domain.post.repository;

import com.teamit.server.domain.post.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findAllByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);

    // 자기참조 FK(parent_id) 때문에 대댓글의 parent를 먼저 null로 만든 뒤 삭제해야 함
    @Modifying
    @Query("UPDATE PostComment c SET c.parent = null WHERE c.post.id = :postId")
    void nullifyParentsByPostId(@Param("postId") Long postId);

    @Modifying
    @Query("DELETE FROM PostComment c WHERE c.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);
}
