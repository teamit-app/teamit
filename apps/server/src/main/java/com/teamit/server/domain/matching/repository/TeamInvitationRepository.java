package com.teamit.server.domain.matching.repository;

import com.teamit.server.domain.matching.entity.TeamInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, Long> {

    List<TeamInvitation> findAllByReceiverId(Long receiverId);

    List<TeamInvitation> findAllByPostId(Long postId);

    @Modifying
    @Query("DELETE FROM TeamInvitation i WHERE i.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);
}
