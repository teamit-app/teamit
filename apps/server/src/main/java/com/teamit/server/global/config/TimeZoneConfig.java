package com.teamit.server.global.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * 서버(Docker 컨테이너) 기본 타임존이 시스템/리전에 따라 UTC 등으로 달라질 수 있어,
 * {@code LocalDateTime.now()}(JPA Auditing의 createdAt 등)가 항상 Asia/Seoul 벽시계
 * 시각을 반환하도록 JVM 기본 타임존을 명시적으로 고정한다.
 */
@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void setDefaultTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
    }
}
