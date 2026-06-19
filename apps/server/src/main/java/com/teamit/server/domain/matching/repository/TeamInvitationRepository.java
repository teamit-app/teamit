package com.teamit.server.domain.matching.repository;

import com.teamit.server.domain.matching.entity.TeamInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, Long> {
}
