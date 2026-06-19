package com.teamit.server.domain.home.repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
@RequiredArgsConstructor
public class HomeRepository {

    private final EntityManager em;

    // REQUIRES_NEW: 별도 트랜잭션으로 실행 — 테이블 미존재 예외가 부모 트랜잭션을 오염시키지 않음
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public long countPendingInvitations(Long userId) {
        try {
            Number result = (Number) em.createNativeQuery(
                    "SELECT COUNT(*) FROM team_invitations WHERE receiver_id = :userId AND status = 'PENDING'"
            ).setParameter("userId", userId).getSingleResult();
            return result.longValue();
        } catch (Exception e) {
            // team_invitations 테이블 미구현 시 0 반환
            return 0L;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public long countApplications(Long userId) {
        try {
            Number result = (Number) em.createNativeQuery(
                    "SELECT COUNT(*) FROM post_applications WHERE user_id = :userId"
            ).setParameter("userId", userId).getSingleResult();
            return result.longValue();
        } catch (Exception e) {
            // post_applications 테이블 미구현 시 0 반환
            return 0L;
        }
    }
}
