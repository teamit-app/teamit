# 티밋(Teamit) API 명세서

> **Base URL**: `https://api.teamit.app/api/v1`  
> **인증**: 개발 중 인증 없음 (추후 `Authorization: Bearer {JWT}` 헤더 추가)  
> **Content-Type**: `application/json`  
> **공통 응답 포맷**:
> ```json
> {
>   "success": true,
>   "data": { ... },
>   "message": "요청이 처리되었습니다"
> }
> ```
> **공통 에러 포맷**:
> ```json
> {
>   "success": false,
>   "data": null,
>   "message": "에러 메시지"
> }
> ```

---

## 도메인 목차
1. [User (사용자/온보딩/프로필)](#1-user)
2. [Skill (기술 스택)](#2-skill)
3. [Contest (공모전)](#3-contest)
4. [Post (모집글)](#4-post)
5. [Matching (지원/초대)](#5-matching)
6. [Chat (채팅)](#6-chat)
7. [Notification (알림)](#7-notification)
8. [Auth (카카오 로그인)](#8-auth)

---

## 1. User

### 1-1. 온보딩 — 기본정보 저장
**POST** `/users/onboarding/basic`

**Request Body**
```json
{
  "nickname": "김티밋",
  "name": "김민준",
  "gender": "MALE",
  "birthDate": "2002-05-11"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "김티밋",
    "name": "김민준",
    "gender": "MALE",
    "birthDate": "2002-05-11"
  },
  "message": "기본 정보가 저장되었습니다"
}
```

---

### 1-2. 온보딩 — 활동 가능 지역 저장
**POST** `/users/{userId}/regions`

**Request Body**
```json
{
  "regions": [
    { "sido": "서울", "sigungu": "강남구" },
    { "sido": "서울", "sigungu": null }
  ]
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "regions": [
      { "id": 1, "sido": "서울", "sigungu": "강남구" }
    ]
  },
  "message": "지역 정보가 저장되었습니다"
}
```

---

### 1-3. 온보딩 — 학력 저장
**POST** `/users/{userId}/educations`

**Request Body**
```json
{
  "schoolName": "연세대학교",
  "status": "ATTENDING",
  "majorType": "SINGLE",
  "major": "컴퓨터공학과",
  "subMajor": null
}
```
> `status`: `ATTENDING` / `COMPLETED` / `EXPECTED` / `GRADUATED`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "educationId": 1,
    "schoolName": "연세대학교",
    "status": "ATTENDING",
    "major": "컴퓨터공학과",
    "verified": false
  },
  "message": "학력 정보가 저장되었습니다"
}
```

---

### 1-4. 학력 인증 서류 제출
**POST** `/users/{userId}/educations/{educationId}/verification`

**Request Body** (multipart/form-data)
```
docType: STUDENT_ID | ENROLLMENT_CERT
file: (파일)
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "verificationId": 1,
    "status": "PENDING",
    "submittedAt": "2025-03-10T14:32:00"
  },
  "message": "서류가 제출되었습니다. 1~2일 내로 결과를 알려드려요"
}
```

---

### 1-5. 학력 인증 상태 조회
**GET** `/users/{userId}/educations/{educationId}/verification`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "status": "APPROVED",
    "docType": "ENROLLMENT_CERT",
    "fileName": "재학증명서_2025.jpg",
    "submittedAt": "2025-03-10T14:32:00",
    "reviewedAt": "2025-03-12T10:00:00",
    "rejectReason": null
  },
  "message": "인증 상태 조회 성공"
}
```
> `status`: `PENDING` / `APPROVED` / `REJECTED`

---

### 1-6. 내 프로필 조회
**GET** `/users/{userId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "김티밋",
    "name": "김민준",
    "gender": "MALE",
    "birthDate": "2002-05-11",
    "profileImageUrl": "https://...",
    "isMatchingActive": true,
    "regions": [
      { "sido": "서울", "sigungu": "강남구" }
    ],
    "education": {
      "schoolName": "연세대학교",
      "status": "ATTENDING",
      "major": "컴퓨터공학과",
      "verified": true
    },
    "skills": [
      { "skillId": 1, "skillName": "React", "level": 3 }
    ],
    "careers": [
      {
        "careerItemId": 1,
        "careerType": "CONTEST",
        "contestName": "2024 대학생 창업 아이디어 공모전",
        "role": "기획",
        "awardStatus": "AWARDED"
      }
    ]
  },
  "message": "프로필 조회 성공"
}
```

---

### 1-7. 프로필 수정
**PATCH** `/users/{userId}`

**Request Body** (수정할 필드만 포함)
```json
{
  "nickname": "새닉네임",
  "gender": "MALE",
  "birthDate": "2002-05-11"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "새닉네임"
  },
  "message": "프로필이 수정되었습니다"
}
```

---

### 1-8. 프로필 이미지 업로드
**POST** `/users/{userId}/profile-image`

**Request Body** (multipart/form-data)
```
image: (파일)
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "profileImageUrl": "https://s3.amazonaws.com/teamit/..."
  },
  "message": "프로필 이미지가 업로드되었습니다"
}
```

---

### 1-9. 제안 받기 활성화/비활성화
**PATCH** `/users/{userId}/matching-status`

**Request Body**
```json
{
  "isMatchingActive": true
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "isMatchingActive": true
  },
  "message": "매칭 상태가 변경되었습니다"
}
```

---

### 1-10. 기술 스택 추가
**POST** `/users/{userId}/skills`

**Request Body**
```json
{
  "skillId": 1,
  "skillNameCustom": null,
  "level": 3,
  "levelDescription": null
}
```
> `skillId`가 null이면 `skillNameCustom` 필수

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "userSkillId": 1,
    "skillName": "React",
    "level": 3
  },
  "message": "기술 스택이 추가되었습니다"
}
```

---

### 1-11. 기술 스택 수정
**PATCH** `/users/{userId}/skills/{userSkillId}`

**Request Body**
```json
{
  "level": 4,
  "levelDescription": "복잡한 상태관리 및 성능 최적화 가능"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "userSkillId": 1,
    "level": 4
  },
  "message": "기술 스택이 수정되었습니다"
}
```

---

### 1-12. 기술 스택 삭제
**DELETE** `/users/{userId}/skills/{userSkillId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "기술 스택이 삭제되었습니다"
}
```

---

### 1-13. 경험 추가 — 공모전
**POST** `/users/{userId}/careers/contests`

**Request Body**
```json
{
  "contestName": "2024 대학생 창업 아이디어 공모전",
  "role": "기획",
  "awardStatus": "AWARDED"
}
```
> `awardStatus`: `AWARDED` / `NOT_AWARDED` / `PARTICIPATED`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "careerItemId": 1,
    "careerType": "CONTEST",
    "contestName": "2024 대학생 창업 아이디어 공모전",
    "role": "기획",
    "awardStatus": "AWARDED"
  },
  "message": "공모전 경험이 추가되었습니다"
}
```

---

### 1-14. 경험 추가 — 자격증
**POST** `/users/{userId}/careers/certificates`

**Request Body**
```json
{
  "certName": "SQLD (SQL 개발자)"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "careerItemId": 2,
    "careerType": "CERTIFICATE",
    "certName": "SQLD (SQL 개발자)"
  },
  "message": "자격증이 추가되었습니다"
}
```

---

### 1-15. 경험 삭제
**DELETE** `/users/{userId}/careers/{careerItemId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "경험이 삭제되었습니다"
}
```

---

### 1-16. 매칭 프로필 저장/수정
**PUT** `/users/{userId}/matching-profile`

**Request Body**
```json
{
  "roleName": "개발",
  "purposeTag": "PORTFOLIO",
  "purposeTagSecondary": "SPEC",
  "purposeIntensity": 3,
  "onlineOfflinePref": "MIXED",
  "teamVibe": 7,
  "feedbackStyle": 8,
  "leadershipPref": "IF_NEEDED",
  "appealText": "React 3년, 주 5~8시간 가능합니다"
}
```
> `purposeTag`: `SPEC` / `PORTFOLIO` / `GROWTH` / `NETWORKING`  
> `onlineOfflinePref`: `ONLINE` / `OFFLINE` / `MIXED`  
> `leadershipPref`: `WANT` / `IF_NEEDED` / `DONT_WANT`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "matchingProfileId": 1,
    "roleName": "개발",
    "updatedAt": "2025-06-01T10:00:00"
  },
  "message": "매칭 프로필이 저장되었습니다"
}
```

---

### 1-17. 매칭 프로필 조회
**GET** `/users/{userId}/matching-profile`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "roleName": "개발",
    "purposeTag": "PORTFOLIO",
    "purposeTagSecondary": "SPEC",
    "purposeIntensity": 3,
    "onlineOfflinePref": "MIXED",
    "teamVibe": 7,
    "feedbackStyle": 8,
    "leadershipPref": "IF_NEEDED",
    "appealText": "React 3년, 주 5~8시간 가능합니다"
  },
  "message": "매칭 프로필 조회 성공"
}
```

---

### 1-18. 인재풀 목록 조회 (탐색 탭)
**GET** `/users?skillId={skillId}&sido={sido}&role={role}&keyword={keyword}&page={page}&size={size}`

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| skillId | Long | N | 스킬 필터 |
| sido | String | N | 지역 필터 |
| role | String | N | 역할 필터 |
| keyword | String | N | 키워드 검색 (닉네임, 보유스킬명 LIKE 검색) |
| page | int | N | 페이지 번호 (기본 0) |
| size | int | N | 페이지 크기 (기본 20) |

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "userId": 2,
        "nickname": "닉네임",
        "gender": "MALE",
        "schoolName": "연세대학교",
        "major": "컴퓨터공학",
        "verified": true,
        "skills": [
          { "skillName": "React", "level": 3 },
          { "skillName": "TypeScript", "level": 3 }
        ],
        "certificates": [],
        "isMatchingActive": true
      }
    ],
    "totalElements": 100,
    "totalPages": 5,
    "currentPage": 0
  },
  "message": "인재풀 조회 성공"
}
```

---

### 1-19. 인재풀 하트 (관심 팀원 추가)
**POST** `/users/{userId}/hearts/{targetUserId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "관심 팀원으로 저장되었습니다"
}
```

---

### 1-20. 인재풀 하트 취소
**DELETE** `/users/{userId}/hearts/{targetUserId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "관심 팀원이 취소되었습니다"
}
```

---

### 1-21. 관심 팀원 목록 조회
**GET** `/users/{userId}/hearts`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "userId": 2,
        "nickname": "닉네임",
        "gender": "MALE",
        "schoolName": "연세대학교",
        "skills": [
          { "skillName": "React", "level": 3 }
        ]
      }
    ]
  },
  "message": "관심 팀원 목록 조회 성공"
}
```

---

## 2. Skill

### 2-1. 기술 스택 전체 목록 조회
**GET** `/skills`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "skills": [
      { "skillId": 1, "name": "React", "category": "개발" },
      { "skillId": 2, "name": "Figma", "category": "디자인" }
    ]
  },
  "message": "기술 스택 목록 조회 성공"
}
```

---

### 2-2. 기술 스택 카테고리별 조회
**GET** `/skills?category={category}`

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| category | String | N | `디자인` / `개발` / `데이터` / `기획` |

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "skills": [
      { "skillId": 1, "name": "React", "category": "개발" }
    ]
  },
  "message": "기술 스택 조회 성공"
}
```

---

### 2-3. 기술 스택 검색
**GET** `/skills/search?keyword={keyword}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "skills": [
      { "skillId": 1, "name": "React", "category": "개발" }
    ]
  },
  "message": "검색 성공"
}
```

---

## 3. Contest

### 3-1. 공모전 목록 조회
**GET** `/contests?category={category}&status={status}&keyword={keyword}&page={page}&size={size}`

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| category | String | N | `IT` / `STARTUP` / `DESIGN` / `SOCIAL` / `ENGINEERING` / `ARTS` / `ETC` |
| status | String | N | `ONGOING` / `DEADLINE_SOON` / `CLOSED` |
| keyword | String | N | 키워드 검색 (공모전명, 주최기관, 카테고리 LIKE 검색) |
| page | int | N | 기본 0 |
| size | int | N | 기본 20 |

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "contestId": 1,
        "title": "2025 대학생 창업 아이디어 공모전",
        "organizer": "창업진흥원",
        "category": "STARTUP",
        "endDate": "2025-08-15",
        "dDay": 94,
        "isNew": true
      }
    ],
    "totalElements": 50,
    "totalPages": 3,
    "currentPage": 0
  },
  "message": "공모전 목록 조회 성공"
}
```

---

### 3-2. 공모전 상세 조회
**GET** `/contests/{contestId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "contestId": 1,
    "title": "2025 대학생 창업 아이디어 공모전",
    "organizer": "창업진흥원",
    "category": "STARTUP",
    "target": "대학생 / 대학원생 / 일반인",
    "recruitField": "창업 아이디어, IT, 사회혁신",
    "prize": "총 5,000만원 (대상 2,000만원)",
    "startDate": "2025-06-01",
    "endDate": "2025-08-15",
    "dDay": 94,
    "linkUrl": "https://...",
    "isHearted": false
  },
  "message": "공모전 상세 조회 성공"
}
```

---

### 3-3. 공모전 하트 (관심 공모전 추가)
**POST** `/users/{userId}/contest-hearts/{contestId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "관심 공모전으로 저장되었습니다"
}
```

---

### 3-4. 공모전 하트 취소
**DELETE** `/users/{userId}/contest-hearts/{contestId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "관심 공모전이 취소되었습니다"
}
```

---

### 3-5. 관심 공모전 목록 조회
**GET** `/users/{userId}/contest-hearts`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "contestId": 1,
        "title": "2025 대학생 창업 아이디어 공모전",
        "organizer": "창업진흥원",
        "endDate": "2025-08-15",
        "dDay": 94
      }
    ]
  },
  "message": "관심 공모전 목록 조회 성공"
}
```

---

## 4. Post

### 4-1. 모집글 생성
**POST** `/posts`

**Request Body**
```json
{
  "userId": 1,
  "contestId": 1,
  "postType": "CONTEST",
  "recruitMode": "BUILD",
  "title": "2025 대학생 창업 아이디어 공모전 팀원 모집",
  "description": "안녕하세요! 창업 공모전 팀원을 찾습니다...",
  "recruitCount": 3,
  "genderCondition": "ANY",
  "schoolCondition": "ANY",
  "onlineOffline": "MIXED",
  "deadline": "2025-08-01",
  "requiredSkills": [
    { "skillId": 1 },
    { "skillId": null, "skillNameCustom": "Figma" }
  ]
}
```
> `postType`: `CONTEST` / `STARTUP` / `PROJECT`  
> `recruitMode`: `BUILD` / `JOIN`  
> `genderCondition`: `ANY` / `SAME` / `OPPOSITE`  
> `schoolCondition`: `ANY` / `SAME_SCHOOL`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "postId": 1,
    "title": "2025 대학생 창업 아이디어 공모전 팀원 모집",
    "status": "OPEN"
  },
  "message": "모집글이 등록되었습니다"
}
```

---

### 4-2. 모집글 상세 조회
**GET** `/posts/{postId}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "postId": 1,
    "userId": 1,
    "nickname": "김티밋",
    "contestId": 1,
    "contestTitle": "2025 대학생 창업 아이디어 공모전",
    "postType": "CONTEST",
    "recruitMode": "BUILD",
    "title": "2025 대학생 창업 아이디어 공모전 팀원 모집",
    "description": "안녕하세요!...",
    "recruitCount": 3,
    "genderCondition": "ANY",
    "schoolCondition": "ANY",
    "onlineOffline": "MIXED",
    "deadline": "2025-08-01",
    "status": "OPEN",
    "requiredSkills": [
      { "skillId": 1, "skillName": "React" }
    ],
    "createdAt": "2025-06-01T10:00:00"
  },
  "message": "모집글 조회 성공"
}
```

---

### 4-3. 내 모집글 목록 조회
**GET** `/users/{userId}/posts?status={status}`

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | String | N | `OPEN` / `CLOSED` |

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "postId": 1,
        "contestTitle": "2025 대학생 창업 아이디어 공모전",
        "recruitCount": 3,
        "status": "OPEN",
        "deadline": "2025-08-01",
        "dDay": 94
      }
    ]
  },
  "message": "내 모집글 조회 성공"
}
```

---

### 4-4. 모집글 수정
**PATCH** `/posts/{postId}`

**Request Body** (수정할 필드만)
```json
{
  "description": "수정된 모집글 내용",
  "deadline": "2025-08-10"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "postId": 1
  },
  "message": "모집글이 수정되었습니다"
}
```

---

### 4-5. 모집글 마감 처리
**PATCH** `/posts/{postId}/close`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "postId": 1,
    "status": "CLOSED"
  },
  "message": "모집글이 마감 처리되었습니다"
}
```

---

## 5. Matching

### 5-1. 지원하기 (JOIN — 제의 받기 경로)
**POST** `/posts/{postId}/applications`

**Request Body**
```json
{
  "userId": 2,
  "appealText": "React 3년, 주 5~8시간 가능합니다"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "applicationId": 1,
    "status": "PENDING",
    "chatRoomId": 10
  },
  "message": "지원이 완료됐어요! 채팅방이 생성되었습니다"
}
```

---

### 5-2. 내가 지원한 목록 조회
**GET** `/users/{userId}/applications`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "applicationId": 1,
        "postId": 1,
        "contestTitle": "2025 대학생 창업 아이디어 공모전",
        "organizer": "창업진흥원",
        "endDate": "2025-08-15",
        "dDay": 94,
        "status": "PENDING",
        "chatRoomId": 10
      }
    ]
  },
  "message": "지원 목록 조회 성공"
}
```

---

### 5-3. 내 모집글에 지원한 후보 목록 조회
**GET** `/posts/{postId}/applications`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "pinned": [
      {
        "applicationId": 1,
        "userId": 2,
        "nickname": "김민준",
        "gender": "MALE",
        "schoolName": "연세대학교",
        "skills": [{ "skillName": "React", "level": 3 }],
        "appealText": "React 3년...",
        "isPinned": true,
        "pinnedAt": "2025-06-01T10:00:00",
        "status": "PENDING",
        "chatRoomId": 10
      }
    ],
    "others": []
  },
  "message": "지원 후보 목록 조회 성공"
}
```

---

### 5-4. 후보 핀 고정/해제
**PATCH** `/posts/{postId}/applications/{applicationId}/pin`

**Request Body**
```json
{
  "isPinned": true
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "applicationId": 1,
    "isPinned": true
  },
  "message": "핀이 설정되었습니다"
}
```

---

### 5-5. 팀 초대 보내기 (BUILD — 직접 꾸리기 경로)
**POST** `/posts/{postId}/invitations`

**Request Body**
```json
{
  "senderId": 1,
  "receiverId": 2,
  "message": "함께 공모전 참가하실 의향이 있으신가요?"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "invitationId": 1,
    "status": "PENDING",
    "chatRoomId": 11
  },
  "message": "초대를 보냈어요! 채팅방이 생성되었습니다"
}
```

---

### 5-6. 매칭 수락
**PATCH** `/matching/{type}/{id}/accept`

> `type`: `applications` 또는 `invitations`  
> `id`: applicationId 또는 invitationId

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "teamId": 1,
    "groupChatRoomId": 20
  },
  "message": "매칭이 성사됐어요! 팀 채팅방에서 만나요 🎉"
}
```

---

### 5-7. 매칭 거절
**PATCH** `/matching/{type}/{id}/reject`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "거절 처리되었습니다"
}
```

---

## 6. Chat

### 6-1. 채팅방 목록 조회
**GET** `/users/{userId}/chat-rooms`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "groupChats": [
      {
        "chatRoomId": 20,
        "roomType": "GROUP",
        "teamName": "2025 창업 아이디어 팀",
        "memberCount": 5,
        "lastMessage": "내일 오전 10시에 발표 자료 공유할게요!",
        "lastMessageAt": "2025-06-01T10:00:00",
        "unreadCount": 5
      }
    ],
    "directChats": [
      {
        "chatRoomId": 10,
        "roomType": "DIRECT",
        "opponentNickname": "김모집",
        "lastMessage": "안녕하세요! 저희 팀에 합류하실 의향이 있으신가요?",
        "lastMessageAt": "2025-06-01T09:00:00",
        "unreadCount": 2
      }
    ]
  },
  "message": "채팅방 목록 조회 성공"
}
```

---

### 6-2. 채팅 메시지 조회
**GET** `/chat-rooms/{chatRoomId}/messages?page={page}&size={size}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "messageId": 1,
        "senderId": 1,
        "senderNickname": "김티밋",
        "content": "안녕하세요!",
        "isRead": true,
        "createdAt": "2025-06-01T10:21:00"
      }
    ],
    "totalElements": 50,
    "currentPage": 0
  },
  "message": "메시지 조회 성공"
}
```

---

### 6-3. 메시지 전송
**POST** `/chat-rooms/{chatRoomId}/messages`

**Request Body**
```json
{
  "senderId": 1,
  "content": "안녕하세요!"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "messageId": 1,
    "createdAt": "2025-06-01T10:21:00"
  },
  "message": "메시지가 전송되었습니다"
}
```

---

## 7. Notification

### 7-1. 알림 목록 조회
**GET** `/users/{userId}/notifications?page={page}&size={size}`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "notificationId": 1,
        "type": "MATCH_PROPOSAL",
        "title": "팀 매칭 제안이 도착했어요!",
        "body": "기획자 '김티밋'님이 동업 제안을 보냈어요",
        "isRead": false,
        "referenceId": 10,
        "referenceType": "CHAT_ROOM",
        "createdAt": "2025-06-01T10:00:00"
      }
    ],
    "unreadCount": 3
  },
  "message": "알림 목록 조회 성공"
}
```
> `type`: `MATCH_PROPOSAL` / `PROPOSAL_RESPONSE` / `DEADLINE` / `MESSAGE` / `MATCH_SUCCESS` / `ANNOUNCEMENT`

---

### 7-2. 알림 읽음 처리
**PATCH** `/users/{userId}/notifications/{notificationId}/read`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "알림이 읽음 처리되었습니다"
}
```

---

### 7-3. 전체 알림 읽음 처리
**PATCH** `/users/{userId}/notifications/read-all`

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "모든 알림이 읽음 처리되었습니다"
}
```

---

### 7-4. 알림 설정 조회
**GET** `/users/{userId}/notification-settings`

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "matchProposal": true,
    "proposalResponse": true,
    "deadlineAlert": true,
    "messageAlert": true,
    "matchSuccess": true,
    "announcement": true
  },
  "message": "알림 설정 조회 성공"
}
```

---

### 7-5. 알림 설정 수정
**PATCH** `/users/{userId}/notification-settings`

**Request Body**
```json
{
  "matchProposal": false,
  "deadlineAlert": true
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "matchProposal": false,
    "deadlineAlert": true
  },
  "message": "알림 설정이 변경되었습니다"
}
```

---

## 8. Auth

### 8-1. 카카오 로그인
**POST** `/auth/kakao`

**Request Body**
```json
{
  "kakaoAccessToken": "kakao_access_token_here"
}
```

**Response Body (성공 — 기존 회원)**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "isNewUser": false,
    "userId": 1
  },
  "message": "로그인 성공"
}
```

**Response Body (성공 — 신규 회원)**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "isNewUser": true,
    "userId": 1
  },
  "message": "회원가입 성공. 온보딩을 진행해주세요"
}
```

---

### 8-2. 토큰 재발급
**POST** `/auth/reissue`

**Request Body**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  },
  "message": "토큰이 재발급되었습니다"
}
```

---

### 8-3. 로그아웃
**POST** `/auth/logout`

**Request Body**
```json
{
  "userId": 1,
  "refreshToken": "jwt_refresh_token"
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "로그아웃되었습니다"
}
```

---

### 8-4. 회원 탈퇴
**DELETE** `/auth/withdraw`

**Request Body**
```json
{
  "userId": 1
}
```

**Response Body (성공)**
```json
{
  "success": true,
  "data": null,
  "message": "회원 탈퇴가 완료되었습니다"
}
```

---

## 프론트엔드 연동 가이드

### Claude Code에 줄 컨텍스트 예시
```
나는 티밋(Teamit) 앱의 프론트엔드를 개발 중이야.
백엔드 Base URL: https://api.teamit.app/api/v1
현재 개발 중에는 인증 없이 API를 호출해.

[원하는 화면 설명 + 위 명세서에서 해당 API 붙여넣기]
```

### HTTP 상태 코드
| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 에러 |
