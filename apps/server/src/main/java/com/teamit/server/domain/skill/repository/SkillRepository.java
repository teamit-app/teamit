package com.teamit.server.domain.skill.repository;

import com.teamit.server.domain.skill.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, Long> {
}
