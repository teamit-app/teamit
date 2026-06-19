package com.teamit.server.domain.user.entity;

import com.teamit.server.domain.skill.entity.Skill;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "user_skills")
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Column(name = "skill_name_custom", length = 100)
    private String skillNameCustom;

    @Column(name = "level")
    private Integer level;

    @Column(name = "level_description", length = 255)
    private String levelDescription;

    @Builder
    public UserSkill(User user, Skill skill, String skillNameCustom, Integer level, String levelDescription) {
        this.user = user;
        this.skill = skill;
        this.skillNameCustom = skillNameCustom;
        this.level = level;
        this.levelDescription = levelDescription;
    }

    public String getEffectiveSkillName() {
        if (skill != null) return skill.getName();
        return skillNameCustom;
    }
}
