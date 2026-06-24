package com.teamit.server.domain.matching.repository;

import com.teamit.server.domain.matching.entity.TeamInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, Long> {

    List<TeamInvitation> findAllByReceiverId(Long receiverId);
}
