package com.teamit.server.global.config;

import com.teamit.server.domain.chat.repository.ChatRoomMemberRepository;
import com.teamit.server.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// REST의 JwtAuthenticationFilter는 요청마다 검증하지만, 웹소켓은 연결이 오래 유지되므로
// STOMP CONNECT 프레임 시점에 딱 한 번만 검증하고, 그 결과(userId)를 연결의 Principal로
// 붙여둔다. 이후 그 연결 위에서 오가는 프레임은 이미 인증된 세션으로 취급한다.
//
// 다만 "로그인된 사용자인가"와 "그 채팅방 멤버가 맞는가"는 별개 질문이라, 채팅방
// 구독(SUBSCRIBE) 시점에는 멤버십도 추가로 확인한다 — 안 그러면 클라이언트 앱을 거치지
// 않고 STOMP를 직접 말해서(브라우저 콘솔 등) chatRoomId를 아무거나 구독해 남의 대화를
// 엿볼 수 있다. "앱 UI에 그 기능이 없다"는 보안 경계가 될 수 없으므로 서버가 막아야 한다.
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final Pattern CHATROOM_TOPIC = Pattern.compile("^/topic/chatroom/(\\d+)$");

    private final JwtTokenProvider jwtTokenProvider;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor.getFirstNativeHeader("Authorization"));
            if (token == null || !jwtTokenProvider.validate(token)) {
                throw new IllegalArgumentException("유효하지 않은 토큰입니다");
            }
            Long userId = jwtTokenProvider.getUserId(token);
            accessor.setUser((Principal) () -> String.valueOf(userId));

        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            Long chatRoomId = extractChatRoomId(accessor.getDestination());
            if (chatRoomId != null) {
                Principal user = accessor.getUser();
                if (user == null) {
                    throw new IllegalArgumentException("인증되지 않은 연결입니다");
                }
                Long userId = Long.parseLong(user.getName());
                boolean isMember = chatRoomMemberRepository
                        .findByUserIdAndChatRoomId(userId, chatRoomId).isPresent();
                if (!isMember) {
                    throw new IllegalArgumentException("이 채팅방의 멤버가 아닙니다");
                }
            }
        }

        return message;
    }

    private Long extractChatRoomId(String destination) {
        if (destination == null) return null;
        Matcher matcher = CHATROOM_TOPIC.matcher(destination);
        return matcher.matches() ? Long.parseLong(matcher.group(1)) : null;
    }

    private String extractToken(String header) {
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
