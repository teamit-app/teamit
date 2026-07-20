package com.teamit.server.domain.notification.controller;

import com.teamit.server.domain.notification.dto.NotificationPageResponse;
import com.teamit.server.domain.notification.dto.NotificationSettingsRequest;
import com.teamit.server.domain.notification.dto.NotificationSettingsResponse;
import com.teamit.server.domain.notification.service.NotificationService;
import com.teamit.server.global.annotation.LoginUser;
import com.teamit.server.global.response.ApiResponse;
import com.teamit.server.global.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Notification", description = "알림 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "알림 목록 조회")
    @GetMapping("/notifications")
    public ApiResponse<NotificationPageResponse> getNotifications(
            @LoginUser CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        NotificationPageResponse response =
                notificationService.getNotifications(userDetails.getUserId(), page, size);
        return ApiResponse.success(response, "알림 목록 조회 성공");
    }

    @Operation(summary = "알림 전체 읽음 처리")
    @PatchMapping("/notifications/read-all")
    public ApiResponse<Void> markAllAsRead(@LoginUser CustomUserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUserId());
        return ApiResponse.success(null, "알림 읽음 처리 성공");
    }

    @Operation(summary = "알림 설정 조회")
    @GetMapping("/notification-settings")
    public ApiResponse<NotificationSettingsResponse> getSettings(@LoginUser CustomUserDetails userDetails) {
        return ApiResponse.success(notificationService.getSettings(userDetails.getUserId()), "알림 설정 조회 성공");
    }

    @Operation(summary = "알림 설정 수정")
    @PatchMapping("/notification-settings")
    public ApiResponse<NotificationSettingsResponse> updateSettings(
            @LoginUser CustomUserDetails userDetails,
            @RequestBody NotificationSettingsRequest request) {
        return ApiResponse.success(
                notificationService.updateSettings(userDetails.getUserId(), request), "알림 설정 수정 성공");
    }
}
