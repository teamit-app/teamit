package com.teamit.server.global.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// 채팅 메시지·알림을 서버가 클라이언트로 즉시 push하기 위한 STOMP WebSocket 설정.
// SockJS 폴백은 안 붙인다 — 브라우저/RN 모두 네이티브 WebSocket을 지원하므로 이번 스코프에선 불필요.
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic, /queue 구독 + /user 접두사(개인 큐)는 심플 인메모리 브로커가 처리.
        // 하트비트를 설정하지 않으면 심플 브로커는 CONNECTED 프레임에 "0,0"(하트비트 없음)을
        // 응답해서, 클라이언트가 하트비트를 보내려 해도 협상상 무시된다. 그러면 실제 메시지가
        // 오가지 않는 유휴 구간에 아무 프레임도 안 흐르다가, SubProtocolWebSocketHandler가
        // "No messages received"로 판단해 연결을 강제로 끊어버린다(그 뒤로 재연결 반복 실패).
        // 하트비트를 켜서 유휴 상태에서도 최소한의 프레임이 오가게 한다.
        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[] {10000, 10000})
                .setTaskScheduler(webSocketHeartbeatScheduler());
        // 클라이언트 → 서버로 발행할 때 붙이는 접두사 (지금은 서버가 push만 하고
        // 클라이언트가 STOMP로 직접 발행하는 기능은 없지만, 향후 확장을 위해 표준대로 설정)
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Bean
    public TaskScheduler webSocketHeartbeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
