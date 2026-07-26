package com.teamit.server.domain.user.service;

import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.repository.ContestParticipantRepository;
import com.teamit.server.domain.contest.repository.ContestRepository;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.matching.entity.PostApplication;
import com.teamit.server.domain.matching.repository.PostApplicationRepository;
import com.teamit.server.domain.education.repository.EducationRepository;
import com.teamit.server.domain.post.dto.PostListItemResponse;
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

    private static final String PROFILE_IMAGE_SUB_DIR = "profile-images";

    @Transactional(readOnly = true)
    public MyProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        boolean needsOnboarding = user.getName() == null;
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

        return MyProfileResponse.of(user, needsOnboarding, regions, education, skills, careers,
                Math.round(averageRating * 10) / 10.0);
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
        return OnboardingBasicResponse.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .name(user.getName())
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .build();
    }

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
}
