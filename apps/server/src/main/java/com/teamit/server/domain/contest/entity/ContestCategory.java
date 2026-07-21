package com.teamit.server.domain.contest.entity;

// category 컬럼이 @Enumerated(EnumType.STRING) 없이 ordinal(선언 순서)로 저장되고 있어서,
// 기존 값의 순서를 바꾸면 안 되고 새 항목은 반드시 맨 뒤에 추가해야 한다.
public enum ContestCategory {
    IT, STARTUP, DESIGN, SOCIAL, ENGINEERING, ARTS, ETC, MARKETING
}
