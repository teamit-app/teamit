package com.teamit.server.domain.contest.entity;

// contest_categories 조인 테이블 컬럼이 @Enumerated(EnumType.STRING)으로 저장되므로
// (Contest.java 참고) enum 선언 순서는 저장에 영향 없다 — 표시 순서는 프론트
// apps/mobile/src/constants/contestCategory.ts의 CONTEST_CATEGORY_ORDER가 따로 관리한다.
public enum ContestCategory {
    IT, STARTUP, DESIGN, MEDIA, SOCIAL, ENGINEERING, ARTS, ETC, MARKETING
}
