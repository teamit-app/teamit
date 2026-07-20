package com.teamit.server.domain.notification.repository;

import com.teamit.server.domain.notification.entity.NotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationSettingsRepository extends JpaRepository<NotificationSettings, Long> {
}
