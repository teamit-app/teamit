package com.teamit.server.global.config;

import io.micrometer.cloudwatch2.CloudWatchConfig;
import io.micrometer.cloudwatch2.CloudWatchMeterRegistry;
import io.micrometer.core.instrument.Clock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatch.CloudWatchAsyncClient;

import java.time.Duration;

// Spring Boot 4.0부터 management.cloudwatch.metrics.export.* 프로퍼티를 읽어서
// CloudWatchMeterRegistry를 자동 등록해주던 오토컨피그가 프레임워크에서 빠졌다
// (spring-boot-actuator-autoconfigure, spring-boot-micrometer-metrics 어느 jar에도
// CloudWatch 관련 클래스가 없음을 직접 확인함). 그래서 application.yml에 있던 그
// 프로퍼티들은 실제로는 아무도 읽지 않는 죽은 설정이었고 — 이게 지표가 CloudWatch에
// 한 번도 전송되지 않았는데 에러 로그조차 없었던 이유다(시도 자체가 없었으므로).
// 레지스트리를 직접 빈으로 등록한다.
@Configuration
public class CloudWatchMetricsConfig {

    @Value("${AWS_REGION:ap-northeast-2}")
    private String awsRegion;

    @Bean
    public CloudWatchAsyncClient cloudWatchAsyncClient() {
        return CloudWatchAsyncClient.builder()
                .region(Region.of(awsRegion))
                .build();
    }

    @Bean
    public CloudWatchConfig cloudWatchConfig() {
        return new CloudWatchConfig() {
            @Override
            public String get(String key) {
                return null; // 아래 개별 메서드로 필요한 값만 오버라이드, 나머지는 기본값 사용
            }

            @Override
            public String namespace() {
                return "teamit";
            }

            @Override
            public Duration step() {
                return Duration.ofMinutes(1);
            }

            @Override
            public int batchSize() {
                return 20;
            }
        };
    }

    @Bean
    public CloudWatchMeterRegistry cloudWatchMeterRegistry(
            CloudWatchConfig config, Clock clock, CloudWatchAsyncClient client) {
        return new CloudWatchMeterRegistry(config, clock, client);
    }
}
