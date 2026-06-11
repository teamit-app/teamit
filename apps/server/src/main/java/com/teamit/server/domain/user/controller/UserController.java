package com.teamit.server.domain.user.controller;

import com.teamit.server.domain.user.dto.OnboardingBasicRequest;
import com.teamit.server.domain.user.dto.OnboardingBasicResponse;
import com.teamit.server.domain.user.service.UserService;
import com.teamit.server.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/onboarding/basic")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OnboardingBasicResponse> saveBasicInfo(
            @RequestBody OnboardingBasicRequest request) {
        OnboardingBasicResponse response = userService.saveBasicInfo(request);
        return ApiResponse.success(response, "기본 정보가 저장되었습니다");
    }
}
