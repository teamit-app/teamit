package com.teamit.server.domain.education.controller;

import com.teamit.server.domain.education.dto.EducationRequest;
import com.teamit.server.domain.education.dto.EducationResponse;
import com.teamit.server.domain.education.service.EducationService;
import com.teamit.server.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class EducationController {

    private final EducationService educationService;

    @PostMapping("/{userId}/educations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EducationResponse> saveEducation(
            @PathVariable Long userId,
            @RequestBody EducationRequest request) {
        EducationResponse response = educationService.saveEducation(userId, request);
        return ApiResponse.success(response, "학력 정보가 저장되었습니다");
    }
}
