package com.teamit.server.domain.matching.repository;

import com.teamit.server.domain.matching.entity.PostApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostApplicationRepository extends JpaRepository<PostApplication, Long> {

    List<PostApplication> findAllByApplicantId(Long userId);

    List<PostApplication> findAllByPostId(Long postId);

    // 모집글 삭제 cascade에서 알림 대상 id만 뽑아쓰기 위한 용도.
    // findAllByPostId로 엔티티를 통째로 불러오면 뒤이은 deleteAllByPostId(bulk delete)가
    // 영속성 컨텍스트를 갱신하지 않아, 이 엔티티들이 이미 지워진 Post를 여전히 참조하는
    // stale 상태로 남는다. 이후 다른 bulk 연산이 auto-flush를 유발하면 Hibernate가 그 stale
    // PostApplication.post 참조를 검증하다 TransientPropertyValueException을 던진다.
    // id만 조회하면 엔티티가 영속성 컨텍스트에 올라가지 않아 이 문제가 생기지 않는다.
    @Query("SELECT a.applicant.id FROM PostApplication a WHERE a.post.id = :postId")
    List<Long> findApplicantIdsByPostId(@Param("postId") Long postId);

    long countByPostId(Long postId);

    java.util.Optional<PostApplication> findByIdAndApplicantId(Long id, Long applicantId);

    Optional<PostApplication> findByPostIdAndApplicantId(Long postId, Long applicantId);

    @Modifying
    @Query("DELETE FROM PostApplication a WHERE a.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);
}
