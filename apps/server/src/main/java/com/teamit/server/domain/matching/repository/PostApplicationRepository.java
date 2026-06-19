package com.teamit.server.domain.matching.repository;

import com.teamit.server.domain.matching.entity.PostApplication;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostApplicationRepository extends JpaRepository<PostApplication, Long> {
}
