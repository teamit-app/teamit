package com.teamit.server.global.exception;

import com.teamit.server.global.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// 서비스 계층에서 던지는 IllegalArgumentException/IllegalStateException을 그대로 두면
// 스프링 기본 500 에러(메시지 없음)로 나가서 클라이언트가 원인을 알 수 없다.
// ApiResponse.error(message) 형태로 감싸서 apiRequest()가 message를 그대로 파싱해
// 사용자에게 보여줄 수 있도록 한다.
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException e) {
        return ApiResponse.error(e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleIllegalState(IllegalStateException e) {
        return ApiResponse.error(e.getMessage());
    }

    // 요청 JSON 파싱 실패(예: 빈 문자열 ""을 LocalDate 필드로 보낸 경우)는 클라이언트 잘못이라
    // 400이어야 하는데, 이 클래스가 없으면 스프링 기본 400 처리로 가지만 아래 catch-all
    // Exception 핸들러가 먼저 잡아버려서 500으로 나가고 있었다. 명시적으로 400을 반환한다.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleMessageNotReadable(HttpMessageNotReadableException e) {
        log.warn("요청 본문 파싱 실패: {}", e.getMessage());
        return ApiResponse.error("요청 형식이 올바르지 않아요. 입력값을 확인해주세요.");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleUnexpected(Exception e) {
        log.error("예상하지 못한 서버 오류", e);
        return ApiResponse.error("서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
    }
}
