package com.teamit.server.domain.user.controller;

import com.teamit.server.domain.user.dto.OnboardingBasicRequest;
import com.teamit.server.domain.user.dto.OnboardingBasicResponse;
import com.teamit.server.domain.user.service.UserService;
import com.teamit.server.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "사용자 온보딩 및 프로필 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "온보딩 기본정보 저장", description = "닉네임, 이름, 성별, 생년월일을 저장합니다.")
    @PostMapping("/onboarding/basic")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OnboardingBasicResponse> saveBasicInfo(
            @RequestBody OnboardingBasicRequest request) {
        OnboardingBasicResponse response = userService.saveBasicInfo(request);
        return ApiResponse.success(response, "기본 정보가 저장되었습니다");
    }
}
