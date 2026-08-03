package com.teamit.server.global.config;

import com.teamit.server.global.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // 베타테스트 단계: 웹 프론트가 참가자마다 다른 LAN IP(포트도 다름)에서 접속하므로 전체 허용.
    // 공개 배포 시에는 실제 프론트엔드 도메인으로 좁혀야 한다.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/api/v1/auth/kakao", "/api/v1/auth/reissue").permitAll()
                        .requestMatchers("/api/v1/auth/kakao/web", "/api/v1/auth/kakao/session/**").permitAll()
                        .requestMatchers("/oauth/kakao/callback").permitAll()
                        .requestMatchers("/api/v1/auth/dev/**").permitAll() // 로컬 개발 전용
                        // 웹소켓 핸드셰이크(HTTP Upgrade) 요청엔 브라우저가 커스텀 헤더를 못 실어서
                        // Authorization이 없다 — 인증은 STOMP CONNECT 프레임 단계에서 별도로 한다
                        // (StompAuthChannelInterceptor 참고)
                        .requestMatchers("/ws/**").permitAll()
                        // 프로필 사진 등 공개 업로드 파일 정적 서빙 (WebMvcConfig 참고)
                        .requestMatchers("/files/**").permitAll()
                        // Actuator(health/metrics)는 관리용 포트(8081, docker-compose에서 127.0.0.1에만
                        // 바인딩)로만 도달 가능해서 외부(인터넷)에서는 애초에 접근 자체가 안 된다.
                        // 이 규칙이 없으면 anyRequest().authenticated()에 걸려 EC2 안에서 SSH 후
                        // curl로 확인하려는 것도 403으로 막힌다.
                        .requestMatchers("/actuator/**").permitAll()
                        // 로그인 없이도 둘러볼 수 있어야 하는 조회 전용 API. 절대 "/api/v1/contests/*"처럼
                        // 한 세그먼트짜리 와일드카드를 쓰지 않는다 — "/contests/my-participations",
                        // "/users/me" 같은 이름이 같은 모양의 비공개 엔드포인트까지 같이 뚫려버리기 때문에,
                        // 숫자 ID 상세 조회는 반드시 앵커 정규식으로 숫자만 매칭한다.
                        .requestMatchers(
                                new RegexRequestMatcher("^/api/v1/contests/\\d+$", "GET"),
                                new RegexRequestMatcher("^/api/v1/contests/\\d+/posts$", "GET"),
                                new RegexRequestMatcher("^/api/v1/posts/\\d+$", "GET"),
                                new RegexRequestMatcher("^/api/v1/posts/\\d+/comments$", "GET"),
                                new RegexRequestMatcher("^/api/v1/users/\\d+$", "GET"),
                                new RegexRequestMatcher("^/api/v1/users/\\d+/careers$", "GET")
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/contests", "/api/v1/contests/popular", "/api/v1/users")
                        .permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * @Component 붙은 JwtAuthenticationFilter를 Spring Boot이 서블릿 컨테이너에 자동 등록하면
     * OncePerRequestFilter의 "이미 실행됨" 표시 때문에 Security 체인 내 버전이 스킵되고
     * SecurityContextHolderFilter가 컨텍스트를 덮어써서 인증이 사라짐 → 403.
     * 자동 등록을 비활성화해서 Security 체인 내에서만 동작하도록 한다.
     */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(
            JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
