package com.teamit.server.domain.home.repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class HomeRepository {

    private final EntityManager em;

    public long countPendingInvitations(Long userId) {
        Number result = (Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM team_invitations WHERE receiver_id = :userId AND status = 'PENDING'"
        ).setParameter("userId", userId).getSingleResult();
        return result.longValue();
    }

    public long countApplications(Long userId) {
        Number result = (Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM post_applications WHERE user_id = :userId"
        ).setParameter("userId", userId).getSingleResult();
        return result.longValue();
    }
}
