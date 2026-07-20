package com.teamit.server.domain.notification.service;

import com.teamit.server.domain.notification.dto.NotificationPageResponse;
import com.teamit.server.domain.notification.dto.NotificationResponse;
import com.teamit.server.domain.notification.dto.NotificationSettingsRequest;
import com.teamit.server.domain.notification.dto.NotificationSettingsResponse;
import com.teamit.server.domain.notification.entity.Notification;
import com.teamit.server.domain.notification.entity.NotificationSettings;
import com.teamit.server.domain.notification.entity.NotificationType;
import com.teamit.server.domain.notification.repository.NotificationRepository;
import com.teamit.server.domain.notification.repository.NotificationSettingsRepository;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationSettingsRepository notificationSettingsRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 개인 알림 설정과 무관하게 반드시 발송돼야 하는 시스템 알림(모집글/채팅방 삭제 등)에 사용
    @Transactional
    public void notify(Long userId, NotificationType type, String title, String body,
                        Long referenceId, String referenceType) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = notificationRepository.save(Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build());

        messagingTemplate.convertAndSendToUser(
                String.valueOf(userId), "/queue/notifications", NotificationResponse.from(notification));
    }

    @Transactional
    public void notifyAll(List<Long> userIds, NotificationType type, String title, String body,
                           Long referenceId, String referenceType) {
        userIds.forEach(userId -> notify(userId, type, title, body, referenceId, referenceType));
    }

    @Transactional
    public void notifyAllIfEnabled(List<Long> userIds, NotificationType type, String title, String body,
                                    Long referenceId, String referenceType) {
        userIds.forEach(userId -> notifyIfEnabled(userId, type, title, body, referenceId, referenceType));
    }

    // 핵심 이벤트(팀 제안/제안 응답/매칭 성사) 발송 지점에서 사용 — 개인 알림 설정에서
    // 꺼둔 타입이면 알림을 만들지 않는다(ANNOUNCEMENT는 이 경로를 안 쓰고 notify()를 직접 호출함)
    @Transactional
    public void notifyIfEnabled(Long userId, NotificationType type, String title, String body,
                                 Long referenceId, String referenceType) {
        NotificationSettings settings = getOrCreateSettings(userId);
        boolean enabled = switch (type) {
            case MATCH_PROPOSAL -> settings.isMatchProposal();
            case PROPOSAL_RESPONSE -> settings.isProposalResponse();
            case DEADLINE -> settings.isDeadlineAlert();
            case MESSAGE -> settings.isMessageAlert();
            case MATCH_SUCCESS -> settings.isMatchSuccess();
            case ANNOUNCEMENT -> settings.isAnnouncement();
        };
        if (!enabled) return;
        notify(userId, type, title, body, referenceId, referenceType);
    }

    @Transactional(readOnly = true)
    public NotificationPageResponse getNotifications(Long userId, int page, int size) {
        Page<Notification> result = notificationRepository
                .findAllByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);

        List<NotificationResponse> content = result.getContent().stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());

        return NotificationPageResponse.builder()
                .content(content)
                .unreadCount(unreadCount)
                .build();
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public NotificationSettingsResponse getSettings(Long userId) {
        return NotificationSettingsResponse.from(getOrCreateSettings(userId));
    }

    @Transactional
    public NotificationSettingsResponse updateSettings(Long userId, NotificationSettingsRequest request) {
        NotificationSettings settings = getOrCreateSettings(userId);
        settings.update(request.getMatchProposal(), request.getProposalResponse(), request.getDeadlineAlert(),
                request.getMessageAlert(), request.getMatchSuccess(), request.getAnnouncement());
        return NotificationSettingsResponse.from(settings);
    }

    private NotificationSettings getOrCreateSettings(Long userId) {
        return notificationSettingsRepository.findById(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
            return notificationSettingsRepository.save(NotificationSettings.builder()
                    .user(user)
                    .matchProposal(true)
                    .proposalResponse(true)
                    .deadlineAlert(true)
                    .messageAlert(true)
                    .matchSuccess(true)
                    .announcement(true)
                    .build());
        });
    }
}
