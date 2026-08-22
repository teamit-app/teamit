package com.teamit.server.domain.user.service;

import com.teamit.server.domain.chat.repository.ChatRoomMemberRepository;
import com.teamit.server.domain.chat.entity.ChatRoomMember;
import com.teamit.server.domain.chat.entity.RoomType;
import com.teamit.server.domain.chat.service.ChatService;
import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.repository.ContestHeartRepository;
import com.teamit.server.domain.contest.repository.ContestParticipantRepository;
import com.teamit.server.domain.contest.repository.ContestRepository;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.matching.entity.PostApplication;
import com.teamit.server.domain.matching.repository.PostApplicationRepository;
import com.teamit.server.domain.matching.repository.TeamInvitationRepository;
import com.teamit.server.domain.education.repository.EducationRepository;
import com.teamit.server.domain.notification.repository.NotificationRepository;
import com.teamit.server.domain.notification.repository.NotificationSettingsRepository;
import com.teamit.server.domain.post.dto.PostListItemResponse;
import com.teamit.server.domain.post.repository.PostCommentRepository;
import com.teamit.server.domain.post.repository.PostHeartRepository;
import com.teamit.server.domain.post.service.PostService;
import com.teamit.server.domain.region.entity.UserRegion;
import com.teamit.server.domain.region.repository.UserRegionRepository;
import com.teamit.server.domain.skill.entity.Skill;
import com.teamit.server.domain.skill.repository.SkillRepository;
import com.teamit.server.domain.user.dto.*;
import com.teamit.server.domain.user.entity.AwardStatus;
import com.teamit.server.domain.user.entity.Career;
import com.teamit.server.domain.user.entity.CareerType;
import com.teamit.server.domain.user.entity.MatchingProfile;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.entity.UserHeart;
import com.teamit.server.domain.user.entity.UserSkill;
import com.teamit.server.domain.user.repository.CareerRepository;
import com.teamit.server.domain.user.repository.MatchingProfileRepository;
import com.teamit.server.domain.user.repository.UserHeartRepository;
import com.teamit.server.domain.user.repository.UserRepository;
import com.teamit.server.domain.user.repository.UserSkillRepository;
import com.teamit.server.global.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EducationRepository educationRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final UserHeartRepository userHeartRepository;
    private final UserRegionRepository userRegionRepository;
    private final MatchingProfileRepository matchingProfileRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final ContestRepository contestRepository;
    private final CareerRepository careerRepository;
    private final PostApplicationRepository postApplicationRepository;
    private final PostService postService;
    private final com.teamit.server.domain.review.repository.TeamReviewRepository teamReviewRepository;
    private final FileStorageService fileStorageService;
    private final ContestHeartRepository contestHeartRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationSettingsRepository notificationSettingsRepository;
    private final PostHeartRepository postHeartRepository;
    private final PostCommentRepository postCommentRepository;
    private final TeamInvitationRepository teamInvitationRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatService chatService;

    private static final String PROFILE_IMAGE_SUB_DIR = "profile-images";

    // 가입 시 필수 동의 약관의 현재 버전. 프론트엔드 basic-info.tsx/reconsent.tsx의
    // TERMS_VERSION 상수와 반드시 같은 값으로 맞춰야 한다 — 약관을 개정할 때 이 값을
    // 올리면, 예전 버전에 동의한 유저는 자동으로 재동의 대상(needsTermsReconsent)이 된다.
    private static final String CURRENT_TERMS_VERSION = "2026-08-15";

    @Transactional(readOnly = true)
    public MyProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        boolean needsOnboarding = user.getName() == null;
        // 신규가입 온보딩 중(basic-info)인 유저는 그 화면에서 이미 동의를 받으므로 별도
        // 재동의 게이트를 씌우지 않는다 — needsOnboarding이면 needsTermsReconsent는 false.
        boolean needsTermsReconsent = !needsOnboarding
                && !CURRENT_TERMS_VERSION.equals(user.getTermsVersion());
        List<UserRegion> regions = userRegionRepository.findAllByUserId(userId);
        Education education = educationRepository.findByUserId(userId).orElse(null);
        List<UserSkill> skills = userSkillRepository.findAllByUserIdInWithSkill(List.of(userId));
        List<CareerItemResponse> careers = careerRepository.findAllByUserId(userId).stream()
                .map(CareerItemResponse::from)
                .collect(Collectors.toList());
        double averageRating = teamReviewRepository.findByReceiverId(userId).stream()
                .mapToInt(com.teamit.server.domain.review.entity.TeamReview::getTotalRating)
                .average()
                .orElse(0.0);

        return MyProfileResponse.of(user, needsOnboarding, needsTermsReconsent, regions, education, skills, careers,
                Math.round(averageRating * 10) / 10.0);
    }

    // ──────────────────────────────────────────────────────────────
    // 기존 가입자 재동의 (약관 개정 후 needsTermsReconsent인 유저 전용)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void agreeToTermsReconsent(Long userId, TermsAgreementRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        user.agreeToTerms(request.getTermsVersion(), Boolean.TRUE.equals(request.getAnalyticsOptIn()));
    }

    @Transactional(readOnly = true)
    public List<CareerItemResponse> getUserCareers(Long userId) {
        return careerRepository.findAllByUserId(userId).stream()
                .map(CareerItemResponse::from)
                .collect(Collectors.toList());
    }

    // 활동 가능 지역은 매칭 프로필(saveMatchingProfile)에서만 갱신한다 — 여기서 건드리면
    // 기본정보를 저장할 때마다 매칭 프로필에서 설정한 지역이 지워진다.
    @Transactional
    public void updateMyProfile(Long userId, UpdateMyProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        ensureNicknameAvailable(userId, request.getNickname());
        user.updateBasicInfo(request.getNickname(), request.getName(), request.getGender(), request.getBirthDate());
    }

    // 자기 자신의 기존 닉네임과 같으면(안 바꾸고 그대로 제출) 중복으로 취급하지 않는다.
    private void ensureNicknameAvailable(Long userId, String nickname) {
        userRepository.findByNickname(nickname).ifPresent(existing -> {
            if (!existing.getId().equals(userId)) {
                throw new IllegalStateException("이미 사용 중인 닉네임입니다");
            }
        });
    }

    // 프로필 사진은 인재풀 등 다른 사람에게도 보여야 하므로 인증 없이도 접근 가능한
    // 정적 경로(/files/...)로 저장한다 (WebMvcConfig 참고, 학력 인증서류와 달리 비공개가 아님)
    @Transactional
    public String updateProfileImage(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        String storedFileName = fileStorageService.store(file, PROFILE_IMAGE_SUB_DIR);
        String url = "/files/" + PROFILE_IMAGE_SUB_DIR + "/" + storedFileName;
        user.updateProfileImage(url);
        return url;
    }

    @Transactional
    public void deleteProfileImage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        user.updateProfileImage(null);
    }

    @Transactional
    public CareerItemResponse addContestCareer(Long userId, AddContestCareerRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        String rolesCsv = (request.getRoles() != null && !request.getRoles().isEmpty())
                ? String.join(",", request.getRoles())
                : null;
        Career saved = careerRepository.save(Career.builder()
                .user(user)
                .careerType(CareerType.CONTEST)
                .contestName(request.getContestName())
                .rolesCsv(rolesCsv)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .awardStatus(request.getAwardStatus() != null ? request.getAwardStatus() : AwardStatus.PARTICIPATED)
                .build());
        return CareerItemResponse.from(saved);
    }

    @Transactional
    public CareerItemResponse addCertificateCareer(Long userId, AddCertificateCareerRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        Career saved = careerRepository.save(Career.builder()
                .user(user)
                .careerType(CareerType.CERTIFICATE)
                .certName(request.getCertName())
                .issuingOrg(request.getIssuingOrg())
                .acquiredDate(request.getAcquiredDate())
                .build());
        return CareerItemResponse.from(saved);
    }

    @Transactional
    public void deleteCareer(Long userId, Long careerItemId) {
        careerRepository.findById(careerItemId)
                .filter(career -> career.getUser().getId().equals(userId))
                .ifPresent(careerRepository::delete);
    }

    @Transactional
    public CareerItemResponse updateContestCareer(Long userId, Long careerItemId, AddContestCareerRequest request) {
        Career career = careerRepository.findById(careerItemId)
                .filter(c -> c.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("경력을 찾을 수 없습니다"));
        String rolesCsv = (request.getRoles() != null && !request.getRoles().isEmpty())
                ? String.join(",", request.getRoles())
                : null;
        career.updateContestInfo(request.getContestName(), rolesCsv, request.getStartDate(),
                request.getEndDate(), request.getAwardStatus() != null ? request.getAwardStatus() : AwardStatus.PARTICIPATED);
        return CareerItemResponse.from(career);
    }

    @Transactional
    public CareerItemResponse updateCertificateCareer(Long userId, Long careerItemId, AddCertificateCareerRequest request) {
        Career career = careerRepository.findById(careerItemId)
                .filter(c -> c.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("경력을 찾을 수 없습니다"));
        career.updateCertificateInfo(request.getCertName(), request.getIssuingOrg(), request.getAcquiredDate());
        return CareerItemResponse.from(career);
    }

    /** 온보딩 기본정보 저장: 카카오 로그인으로 생성된 유저에게 name/gender/birthDate 등록 */
    @Transactional
    public OnboardingBasicResponse saveBasicInfo(Long userId, OnboardingBasicRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        ensureNicknameAvailable(userId, request.getNickname());
        user.updateBasicInfo(request.getNickname(), request.getName(),
                request.getGender(), request.getBirthDate());
        user.agreeToTerms(request.getTermsVersion(), Boolean.TRUE.equals(request.getAnalyticsOptIn()));
        return OnboardingBasicResponse.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .name(user.getName())
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .build();
    }

    // 비개인화 공개 목록이라 Redis에 캐싱. isMatchingActive 토글이 실시간성 요구가 있어
    // TTL은 5분으로 짧게 두고, setMatchingActive/registerParticipant에서 명시적으로 evict한다.
    @Cacheable(cacheNames = "userPool",
            key = "T(String).format('%s-%s-%s-%s-%d-%d', #skillId, #sido, #role, #keyword, #page, #size)")
    @Transactional(readOnly = true)
    public UserPoolPageResponse getUserPool(Long skillId, String sido, String role, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.findUserPool(skillId, sido, keyword, pageable);

        List<Long> userIds = userPage.getContent().stream()
                .map(User::getId)
                .collect(Collectors.toList());

        Map<Long, Education> educationMap = educationRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(e -> e.getUser().getId(), e -> e));

        Map<Long, List<UserSkill>> skillMap = userSkillRepository.findAllByUserIdInWithSkill(userIds).stream()
                .collect(Collectors.groupingBy(us -> us.getUser().getId()));

        List<UserPoolResponse> content = userPage.getContent().stream()
                .map(user -> {
                    Education education = educationMap.get(user.getId());
                    List<UserSkillInfo> skills = skillMap.getOrDefault(user.getId(), List.of()).stream()
                            .map(UserSkillInfo::from)
                            .collect(Collectors.toList());
                    return UserPoolResponse.of(user, education, skills);
                })
                .collect(Collectors.toList());

        return UserPoolPageResponse.builder()
                .content(content)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(userPage.getNumber())
                .build();
    }

    @Transactional
    public void addHeart(Long userId, Long targetUserId) {
        if (userHeartRepository.existsByUserIdAndTargetUserId(userId, targetUserId)) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("대상 사용자를 찾을 수 없습니다"));

        userHeartRepository.save(UserHeart.builder()
                .user(user)
                .targetUser(targetUser)
                .build());
    }

    @Transactional
    public void removeHeart(Long userId, Long targetUserId) {
        userHeartRepository.findByUserIdAndTargetUserId(userId, targetUserId)
                .ifPresent(userHeartRepository::delete);
    }

    // ──────────────────────────────────────────────────────────────
    // 매칭 프로필 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MatchingProfileData getMatchingProfile(Long userId) {
        return matchingProfileRepository.findByUserId(userId)
                .map(profile -> {
                    List<UserRegion> regions = userRegionRepository.findAllByUserId(userId);
                    return MatchingProfileData.from(profile, regions);
                })
                .orElse(null);
    }

    // ──────────────────────────────────────────────────────────────
    // 가장 최근에 제출한 참여 카드(공모전 후보 등록 스냅샷) 조회
    // 제출 이력이 없으면 현재 매칭 프로필로 폴백
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MatchingProfileData getLatestParticipationCard(Long userId) {
        return contestParticipantRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(MatchingProfileData::fromSnapshot)
                .orElseGet(() -> getMatchingProfile(userId));
    }

    // ──────────────────────────────────────────────────────────────
    // 매칭 프로필 저장/수정 (upsert)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void saveMatchingProfile(Long userId, MatchingProfileData request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        String skillsCsv = (request.getSkills() != null && !request.getSkills().isEmpty())
                ? String.join(",", request.getSkills())
                : null;

        matchingProfileRepository.findByUserId(userId)
                .ifPresentOrElse(
                        profile -> profile.updateProfile(
                                skillsCsv,
                                request.getExperienceLevel(),
                                request.getIntensityLevel(),
                                request.getOnlineOfflinePref(),
                                request.getTeamVibe(),
                                request.getFeedbackStyle(),
                                request.getLeadershipPref(),
                                request.getParticipationPurpose(),
                                request.getAppealTitle(),
                                request.getAppealContent()
                        ),
                        () -> matchingProfileRepository.save(MatchingProfile.builder()
                                .user(user)
                                .skillsCsv(skillsCsv)
                                .experienceLevel(request.getExperienceLevel())
                                .intensityLevel(request.getIntensityLevel())
                                .onlineOfflinePref(request.getOnlineOfflinePref())
                                .teamVibe(request.getTeamVibe())
                                .feedbackStyle(request.getFeedbackStyle())
                                .leadershipPref(request.getLeadershipPref())
                                .participationPurpose(request.getParticipationPurpose())
                                .appealTitle(request.getAppealTitle())
                                .appealContent(request.getAppealContent())
                                .build())
                );

        // 지역 정보 교체
        userRegionRepository.deleteAllByUserId(userId);
        if (request.getRegions() != null) {
            List<UserRegion> newRegions = request.getRegions().stream()
                    .map(r -> UserRegion.builder()
                            .user(user)
                            .sido(r.sido())
                            .sigungu(r.sigungu())
                            .build())
                    .collect(Collectors.toList());
            userRegionRepository.saveAll(newRegions);
        }

        // 스킬 정보 교체 — 인재풀 목록(getUserPool)은 user_skills 테이블을 조회하므로
        // matching_profile.skills_csv 뿐 아니라 UserSkill도 함께 동기화해야 한다
        userSkillRepository.deleteAllByUserId(userId);
        if (request.getSkills() != null && !request.getSkills().isEmpty()) {
            List<UserSkill> newSkills = request.getSkills().stream()
                    .map(name -> {
                        Skill skill = skillRepository.findByName(name).orElse(null);
                        return UserSkill.builder()
                                .user(user)
                                .skill(skill)
                                .skillNameCustom(skill == null ? name : null)
                                .build();
                    })
                    .collect(Collectors.toList());
            userSkillRepository.saveAll(newSkills);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // 매칭 활성화 상태 변경
    // ──────────────────────────────────────────────────────────────
    @CacheEvict(cacheNames = "userPool", allEntries = true)
    @Transactional
    public void setMatchingActive(Long userId, boolean isMatchingActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        user.setMatchingActive(isMatchingActive);
    }

    // ──────────────────────────────────────────────────────────────
    // 유저 상세 프로필 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public UserDetailResponse getUserDetail(Long userId, Long viewerUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        Education education = educationRepository.findByUserId(userId).orElse(null);
        List<UserSkill> skills = userSkillRepository.findAllByUserIdInWithSkill(List.of(userId));
        List<UserRegion> regions = userRegionRepository.findAllByUserId(userId);
        MatchingProfile profile = matchingProfileRepository.findByUserId(userId).orElse(null);
        List<com.teamit.server.domain.review.entity.TeamReview> receivedReviews =
                teamReviewRepository.findByReceiverId(userId).stream()
                        .sorted(java.util.Comparator.comparing(
                                com.teamit.server.domain.review.entity.TeamReview::getCreatedAt).reversed())
                        .collect(java.util.stream.Collectors.toList());
        boolean isHearted = viewerUserId != null
                && userHeartRepository.existsByUserIdAndTargetUserId(viewerUserId, userId);
        List<Career> careers = careerRepository.findAllByUserId(userId);
        List<PostListItemResponse> myPosts = postService.getMyPosts(userId);
        return UserDetailResponse.from(user, education, skills, regions, profile, receivedReviews,
                careers, myPosts, isHearted);
    }

    // ──────────────────────────────────────────────────────────────
    // 나의 모집글 지원 내역
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MyApplicationResponse> getMyApplications(Long userId) {
        List<PostApplication> applications = postApplicationRepository.findAllByApplicantId(userId);

        List<Long> contestIds = applications.stream()
                .map(a -> a.getPost().getContestId())
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, Contest> contestMap = contestRepository.findAllById(contestIds).stream()
                .collect(Collectors.toMap(Contest::getId, c -> c));

        return applications.stream()
                .map(app -> {
                    Long contestId = app.getPost().getContestId();
                    Contest contest = contestId != null ? contestMap.get(contestId) : null;
                    return MyApplicationResponse.from(app, contest);
                })
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────
    // 공모전 후보 등록 내역
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ContestRegistrationResponse> getContestRegistrations(Long userId) {
        return contestParticipantRepository.findAllByUserId(userId).stream()
                .map(ContestRegistrationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelApplication(Long applicationId, Long userId) {
        postApplicationRepository.findByIdAndApplicantId(applicationId, userId)
                .ifPresent(postApplicationRepository::delete);
    }

    @Transactional(readOnly = true)
    public HeartedUserListResponse getHeartedUsers(Long userId) {
        List<UserHeart> hearts = userHeartRepository.findAllByUserId(userId);

        List<Long> targetIds = hearts.stream()
                .map(h -> h.getTargetUser().getId())
                .collect(Collectors.toList());

        Map<Long, Education> educationMap = educationRepository.findByUserIdIn(targetIds).stream()
                .collect(Collectors.toMap(e -> e.getUser().getId(), e -> e));

        Map<Long, List<UserSkill>> skillMap = userSkillRepository.findAllByUserIdInWithSkill(targetIds).stream()
                .collect(Collectors.groupingBy(us -> us.getUser().getId()));

        List<UserPoolResponse> content = hearts.stream()
                .map(heart -> {
                    User target = heart.getTargetUser();
                    Education education = educationMap.get(target.getId());
                    List<UserSkillInfo> skills = skillMap.getOrDefault(target.getId(), List.of()).stream()
                            .map(UserSkillInfo::from)
                            .collect(Collectors.toList());
                    return UserPoolResponse.of(target, education, skills);
                })
                .collect(Collectors.toList());

        return HeartedUserListResponse.builder()
                .content(content)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // 회원 탈퇴 — 본인 소유 데이터(모집글/지원/좋아요/알림/프로필 상세 등)는 하드
    // 삭제하고, 상대방에게도 속한 데이터(1:1 채팅 메시지, 팀 리뷰)는 User row를 남긴
    // 채 개인정보만 익명화해 보존한다. AuthService.withdraw()에서 refreshToken 삭제와
    // 함께 호출된다.
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void withdraw(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 1) 본인이 작성한 모집글부터 정리 — 소유한 GROUP 채팅방까지 함께 삭제된다
        postService.deleteAllPostsByOwner(userId);

        // 2) 위에서 지워지지 않고 남아있는 채팅방(다른 사람 소유) 정리 — GROUP은 나가기
        // 처리(멤버 row 삭제 + 시스템 메시지), DIRECT는 "1:1 채팅방은 나갈 수 없다"는
        // 기존 정책과 동일하게 그대로 두어 상대방 대화가 끊기지 않게 한다
        for (ChatRoomMember member : chatRoomMemberRepository.findByUserId(userId)) {
            if (member.getChatRoom().getRoomType() == RoomType.GROUP) {
                chatService.leaveChatRoom(member.getChatRoom().getId(), userId);
            }
        }

        // 3) 다른 사람 글에 남긴 지원/초대/댓글/좋아요 등 본인 행위 기록 정리
        postApplicationRepository.deleteAllByApplicantId(userId);
        teamInvitationRepository.deleteAllBySenderIdOrReceiverId(userId);
        postCommentRepository.nullifyChildrenOfAuthor(userId); // 자기참조 FK 해제
        postCommentRepository.deleteAllByAuthorId(userId);
        postHeartRepository.deleteAllByUserId(userId);
        contestHeartRepository.deleteAllByUserId(userId);
        contestParticipantRepository.deleteAllByUserId(userId);
        userHeartRepository.deleteAllByUserIdOrTargetUserId(userId);
        notificationRepository.deleteAllByUserId(userId);

        // 4) 프로필 상세 정보(1:N) 정리
        careerRepository.deleteAllByUserId(userId);
        educationRepository.deleteByUserId(userId);
        userSkillRepository.deleteAllByUserId(userId);
        userRegionRepository.deleteAllByUserId(userId);

        // 5) PK가 곧 user_id인 1:1 테이블 정리 (없을 수도 있어 존재 확인 후 삭제)
        if (matchingProfileRepository.existsById(userId)) {
            matchingProfileRepository.deleteById(userId);
        }
        if (notificationSettingsRepository.existsById(userId)) {
            notificationSettingsRepository.deleteById(userId);
        }

        // 6) team_reviews(영구 평판 데이터)와 남은 DIRECT 채팅 메시지는 삭제하지 않는다 —
        // User row 자체를 남긴 채 개인정보만 지워서, 상대방 화면에는 "탈퇴한 사용자"로 보이게 한다
        user.anonymize();
    }
}
