package com.teamit.server.domain.post.entity;

import com.teamit.server.domain.skill.entity.Skill;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "post_skills")
public class PostSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Column(name = "skill_name_custom", length = 100)
    private String skillNameCustom;

    @Builder
    public PostSkill(Post post, Skill skill, String skillNameCustom) {
        this.post = post;
        this.skill = skill;
        this.skillNameCustom = skillNameCustom;
    }

    public String getEffectiveSkillName() {
        if (skill != null) return skill.getName();
        return skillNameCustom;
    }
}
