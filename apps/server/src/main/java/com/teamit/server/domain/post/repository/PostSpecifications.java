package com.teamit.server.domain.post.repository;

import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.post.entity.PostSkill;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

// ContestSpecifications/UserSpecifications와 동일한 이유(파라미터가 없으면 조건 자체를 SQL에서
// 빼서 인덱스를 정상적으로 타게 함)로 모집글 목록에도 같은 패턴을 적용한다.
public class PostSpecifications {

    public static Specification<Post> keyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;
            String pattern = "%" + keyword.toLowerCase() + "%";

            // 제목 매칭 OR 이 모집글의 스킬(정식 스킬명/커스텀 스킬명) 중 하나라도 매칭
            Subquery<Long> skillSub = query.subquery(Long.class);
            Root<PostSkill> skillRoot = skillSub.from(PostSkill.class);
            var skillJoin = skillRoot.join("skill", JoinType.LEFT);
            skillSub.select(skillRoot.get("post").get("id"))
                    .where(cb.or(
                            cb.like(cb.lower(skillJoin.get("name")), pattern),
                            cb.like(cb.lower(skillRoot.get("skillNameCustom")), pattern)
                    ));

            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    root.get("id").in(skillSub)
            );
        };
    }
}
