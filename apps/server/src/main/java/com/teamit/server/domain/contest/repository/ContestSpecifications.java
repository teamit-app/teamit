package com.teamit.server.domain.contest.repository;

import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.entity.ContestCategory;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.Set;

// findContestList가 예전엔 "(:param IS NULL OR column = :param)" 패턴의 네이티브 SQL 한 방으로
// 돼 있었는데, 이 패턴은 파라미터가 실제로 있든 없든 MySQL이 인덱스를 포기하고 항상 풀스캔하게
// 만든다(부하테스트로 실측: 5만 건 기준 매 요청 5만 건 풀스캔, 0.2~0.7초). Specification은
// 파라미터가 null이면 그 조건 자체를 SQL WHERE절에서 빼버려서(never mind가 아니라 애초에
// 존재하지 않는 조건이 됨), 남은 조건들에 대해 옵티마이저가 정상적으로 인덱스를 검토할 수 있다.
public class ContestSpecifications {

    // 공모전이 카테고리를 여러 개 가질 수 있어(Contest.categories, contest_categories 조인 테이블),
    // "이 카테고리를 포함하는 공모전"을 찾으려면 조인이 필요하다. 조인으로 행이 늘어날 수 있어
    // distinct(true)로 중복 제거한다.
    public static Specification<Contest> category(ContestCategory category) {
        return (root, query, cb) -> {
            if (category == null) return null;
            query.distinct(true);
            Join<Contest, ContestCategory> categoryJoin = root.join("categories");
            return cb.equal(categoryJoin, category);
        };
    }

    // 비슷한 공모전 추천(카테고리가 하나라도 겹치는 공모전) 후보를 뽑을 때 사용 —
    // categories 중 하나라도 주어진 집합에 속하면 매칭.
    public static Specification<Contest> categoryIn(Set<ContestCategory> categories) {
        return (root, query, cb) -> {
            if (categories == null || categories.isEmpty()) return null;
            query.distinct(true);
            Join<Contest, ContestCategory> categoryJoin = root.join("categories");
            return categoryJoin.in(categories);
        };
    }

    public static Specification<Contest> idNot(Long contestId) {
        return (root, query, cb) -> contestId == null ? null : cb.notEqual(root.get("id"), contestId);
    }

    public static Specification<Contest> endDateGreaterThanOrEqual(LocalDate date) {
        return (root, query, cb) -> date == null ? null : cb.greaterThanOrEqualTo(root.get("endDate"), date);
    }

    public static Specification<Contest> endDateLessThanOrEqual(LocalDate date) {
        return (root, query, cb) -> date == null ? null : cb.lessThanOrEqualTo(root.get("endDate"), date);
    }

    public static Specification<Contest> endDateLessThan(LocalDate date) {
        return (root, query, cb) -> date == null ? null : cb.lessThan(root.get("endDate"), date);
    }

    public static Specification<Contest> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;
            query.distinct(true);
            String pattern = "%" + keyword.toLowerCase() + "%";
            Join<Contest, ContestCategory> categoryJoin = root.join("categories", JoinType.LEFT);
            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("organizer")), pattern),
                    cb.like(cb.lower(categoryJoin.as(String.class)), pattern)
            );
        };
    }
}
