package com.teamit.server.domain.education.controller;

import com.teamit.server.domain.education.dto.EducationRequest;
import com.teamit.server.domain.education.dto.EducationResponse;
import com.teamit.server.domain.education.service.EducationService;
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
public class EducationController {

    private final EducationService educationService;

    @Operation(summary = "온보딩 학력 저장", description = "학교명, 재학 상태, 전공 정보를 저장합니다.")
    @PostMapping("/{userId}/educations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EducationResponse> saveEducation(
            @PathVariable Long userId,
            @RequestBody EducationRequest request) {
        EducationResponse response = educationService.saveEducation(userId, request);
        return ApiResponse.success(response, "학력 정보가 저장되었습니다");
    }
}
