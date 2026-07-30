package com.teamit.server.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.cache.autoconfigure.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;

// 공모전 목록/상세, 인재풀처럼 비개인화된 조회 응답을 Redis에 캐싱한다(3라운드: N+1 수정 다음
// 단계). 실제 @Cacheable/@CacheEvict는 ContestService/UserService에 붙어 있고, 여기서는
// 캐시별 TTL과 직렬화, 그리고 Redis 장애 시 폴백 정책만 담당한다.
@Configuration
@EnableCaching
@Slf4j
public class CacheConfig implements CachingConfigurer {

    @Bean
    public RedisCacheConfiguration cacheConfiguration() {
        // 스프링이 자동 구성하는 ObjectMapper 빈을 주입받으려 했으나, RedisCacheConfiguration이
        // (Hibernate 2차 캐시 연동을 위해) entityManagerFactory보다 먼저 초기화되도록 강제되면서
        // 그 시점엔 아직 JacksonAutoConfiguration이 ObjectMapper 빈을 등록하기 전이라
        // "No qualifying bean of type ObjectMapper" 에러로 기동 자체가 실패했다(로컬에서 실제 재현 확인).
        // 그래서 빈 주입 대신 findAndRegisterModules()로 직접 구성해서 초기화 순서 문제를 피한다 —
        // 클래스패스의 JavaTimeModule 등을 스프링 기본 ObjectMapper와 동일하게 자동 인식해준다.
        ObjectMapper cacheObjectMapper = new ObjectMapper().findAndRegisterModules();
        // 캐시 값의 실제 타입을 JSON에 같이 저장해야 읽을 때 어떤 DTO로 복원할지 알 수 있다.
        // 다만 임의 클래스 역직렬화(가젯 공격) 위험을 줄이기 위해 우리 패키지로만 제한한다.
        cacheObjectMapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfSubType("com.teamit.server")
                        .build(),
                ObjectMapper.DefaultTyping.NON_FINAL);

        // spring-data-redis 4.0.5 기준 이 클래스는 제거 예정으로 deprecated 처리돼 있고
        // Jackson 2 기반 대체(GenericJacksonJsonRedisSerializer, Jackson 3 ObjectMapper 요구)가
        // 새로 생겼다. 프로젝트 전체가 아직 Jackson 2(com.fasterxml.jackson)를 쓰고 있어서
        // 지금은 이걸 그대로 쓰고, Jackson 3 전환 시점에 같이 옮기는 걸 후속 작업으로 남긴다.
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(cacheObjectMapper);
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer));
    }

    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer(RedisCacheConfiguration cacheConfiguration) {
        return builder -> builder
                .withCacheConfiguration("contestsPopular", cacheConfiguration.entryTtl(Duration.ofMinutes(30)))
                .withCacheConfiguration("contestsList", cacheConfiguration.entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration("contestsDetail", cacheConfiguration.entryTtl(Duration.ofHours(1)))
                .withCacheConfiguration("userPool", cacheConfiguration.entryTtl(Duration.ofMinutes(5)));
    }

    // 캐시는 어디까지나 최적화이지 데이터 소스가 아니다 — Redis 장애가 서비스 장애로 번지면
    // 안 되므로, 캐시 읽기/쓰기/삭제 실패는 로깅만 하고 삼켜서 원본 DB 조회로 자연스럽게
    // 폴백시킨다(기본 동작은 예외를 그대로 던져 API가 500이 된다).
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("[Cache] {} 캐시 조회 실패, DB로 폴백합니다: {}", cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("[Cache] {} 캐시 저장 실패: {}", cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("[Cache] {} 캐시 삭제 실패: {}", cache.getName(), exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("[Cache] {} 캐시 전체 삭제 실패: {}", cache.getName(), exception.getMessage());
            }
        };
    }
}
