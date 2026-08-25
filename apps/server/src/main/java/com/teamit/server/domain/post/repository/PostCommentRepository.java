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

    @Query("SELECT c.post.id AS postId, COUNT(c) AS count FROM PostComment c WHERE c.post.id IN :postIds GROUP BY c.post.id")
    List<PostCountProjection> countGroupedByPostIdIn(@Param("postIds") List<Long> postIds);

    interface PostCountProjection {
        Long getPostId();
        Long getCount();
    }

    // 자기참조 FK(parent_id) 때문에 대댓글의 parent를 먼저 null로 만든 뒤 삭제해야 함
    @Modifying
    @Query("UPDATE PostComment c SET c.parent = null WHERE c.post.id = :postId")
    void nullifyParentsByPostId(@Param("postId") Long postId);

    @Modifying
    @Query("DELETE FROM PostComment c WHERE c.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);

    // 삭제 대상 댓글(author=X)을 부모로 삼고 있는 다른 댓글의 parent를 먼저 끊는다 —
    // 대상 범위를 post 단위가 아니라 author 단위로 잡는다는 점만 위 nullifyParentsByPostId와 다르다.
    //
    // JPQL "WHERE c.parent.author.id = :authorId"로 짰던 이전 버전은 Hibernate가
    // post_comments를 자기 자신과 JOIN하는 SQL을 만들어서, SET 절의 parent_id가 어느 쪽
    // 테이블인지 MySQL이 판단 못 해 "Column 'parent_id' in field list is ambiguous"
    // (에러 1052)가 났다(회원 탈퇴 시 실제 재현됨 — 대댓글이 달린 댓글을 작성한 유저가 탈퇴
    // 하는 경우). 서브쿼리로 바꿔도 MySQL은 UPDATE 대상 테이블을 WHERE 서브쿼리에서 다시
    // SELECT하는 걸 금지해서(에러 1093) 똑같이 실패한다 — 서브쿼리를 파생 테이블로 한 번 더
    // 감싸면(SELECT * FROM (...) AS t) MySQL이 먼저 결과를 구체화해서 두 제약을 모두 피한다.
    @Modifying
    @Query(value = "UPDATE post_comments SET parent_id = NULL WHERE parent_id IN "
            + "(SELECT * FROM (SELECT id FROM post_comments WHERE author_id = :authorId) AS self_comment_ids)",
            nativeQuery = true)
    void nullifyChildrenOfAuthor(@Param("authorId") Long authorId);

    @Modifying
    @Query("DELETE FROM PostComment c WHERE c.author.id = :authorId")
    void deleteAllByAuthorId(@Param("authorId") Long authorId);
}
