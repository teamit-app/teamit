package com.teamit.server.domain.contest.service;

import com.teamit.server.domain.contest.dto.*;
import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.entity.ContestCategory;
import com.teamit.server.domain.contest.entity.ContestHeart;
import com.teamit.server.domain.contest.entity.ContestParticipant;
import com.teamit.server.domain.contest.entity.ContestStatus;
import com.teamit.server.domain.contest.repository.ContestHeartRepository;
import com.teamit.server.domain.contest.repository.ContestParticipantRepository;
import com.teamit.server.domain.contest.repository.ContestRepository;
import com.teamit.server.domain.chat.service.ChatService;
import com.teamit.server.domain.post.repository.PostRepository;
import com.teamit.server.domain.region.repository.UserRegionRepository;
import com.teamit.server.domain.user.dto.MatchingProfileData;
import com.teamit.server.domain.user.entity.MatchingProfile;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.repository.MatchingProfileRepository;
import com.teamit.server.domain.user.repository.UserRepository;
import com.teamit.server.global.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContestService {

    private static final String CONTEST_POSTER_SUB_DIR = "contest-posters";

    private final ContestRepository contestRepository;
    private final ContestHeartRepository contestHeartRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final UserRepository userRepository;
    private final MatchingProfileRepository matchingProfileRepository;
    private final UserRegionRepository userRegionRepository;
    private final FileStorageService fileStorageService;
    private final PostRepository postRepository;
    private final ChatService chatService;

    // 비개인화 공개 목록이라 Redis에 캐싱 — 관리자 CRUD(createContest/updateContest/deleteContest)에서
    // 무효화한다. 자주 안 바뀌는 데이터라 TTL(30분)을 길게 둠.
    // "인기"는 좋아요(하트) 수 기준으로 상위 10개만 뽑는다 — 예전엔 그냥 최신순이라
    // "인기 공모전"이라는 이름과 실제 정렬 기준이 달랐다.
    @Cacheable(cacheNames = "contestsPopular")
    @Transactional(readOnly = true)
    public PopularContestListResponse getPopularContests() {
        LocalDate today = LocalDate.now();
        List<PopularContestResponse> contests = contestRepository
                .findMostHeartedActiveContests(today, PageRequest.of(0, 10))
                .stream()
                .map(PopularContestResponse::from)
                .collect(Collectors.toList());
        return PopularContestListResponse.builder()
                .contests(contests)
                .build();
    }

    // 필터 조합이 많아 캐시 항목 수가 커질 수 있어 popular보다 TTL을 짧게(10분) 둠.
    @Cacheable(cacheNames = "contestsList",
            key = "T(String).format('%s-%s-%s-%d-%d', #category, #status, #keyword, #page, #size)")
    @Transactional(readOnly = true)
    public ContestPageResponse getContestList(ContestCategory category, ContestStatus status, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        String categoryStr = category != null ? category.name() : null;

        LocalDate today = LocalDate.now();
        LocalDate statusEndMin = null;
        LocalDate statusEndMax = null;
        LocalDate statusEndBefore = null;

        if (status != null) {
            switch (status) {
                case ONGOING -> statusEndMin = today.plusDays(8);
                case DEADLINE_SOON -> {
                    statusEndMin = today;
                    statusEndMax = today.plusDays(7);
                }
                case CLOSED -> statusEndBefore = today;
            }
        }

        Page<Contest> contestPage = contestRepository.findContestList(
                categoryStr, statusEndMin, statusEndMax, statusEndBefore, keyword, pageable);

        List<ContestListItemResponse> content = contestPage.getContent().stream()
                .map(ContestListItemResponse::from)
                .collect(Collectors.toList());

        return ContestPageResponse.builder()
                .content(content)
                .totalElements(contestPage.getTotalElements())
                .totalPages(contestPage.getTotalPages())
                .currentPage(contestPage.getNumber())
                .build();
    }

    // 개별 공모전은 더더욱 안 바뀌는 데이터라 TTL을 1시간까지 길게 두고, 수정/삭제 시
    // 명시적으로 evict해서 즉시 반영되게 한다.
    @Cacheable(cacheNames = "contestsDetail", key = "#contestId")
    @Transactional(readOnly = true)
    public ContestDetailResponse getContestDetail(Long contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("공모전을 찾을 수 없습니다"));
        return ContestDetailResponse.from(contest);
    }

    // ──────────────────────────────────────────────────────────────
    // 관리자 전용 — 공모전 등록/수정/삭제 (AdminContestController)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ContestDetailResponse> getAllContestsForAdmin() {
        return contestRepository.findAllByOrderByIdDesc().stream()
                .map(ContestDetailResponse::from)
                .collect(Collectors.toList());
    }

    // 포스터 이미지를 올리고 URL만 반환한다. 등록/수정 폼에서 이 URL을 ContestRequest.imageUrl에
    // 담아서 보내는 2단계 흐름(프로필 사진 업로드와 동일한 패턴, UserService.updateProfileImage 참고)
    public String uploadPosterImage(MultipartFile file) {
        String storedFileName = fileStorageService.store(file, CONTEST_POSTER_SUB_DIR);
        return "/files/" + CONTEST_POSTER_SUB_DIR + "/" + storedFileName;
    }

    @CacheEvict(cacheNames = {"contestsPopular", "contestsList"}, allEntries = true)
    @Transactional
    public ContestDetailResponse createContest(ContestRequest request) {
        Contest contest = contestRepository.save(Contest.builder()
                .title(request.getTitle())
                .organizer(request.getOrganizer())
                .category(request.getCategory())
                .target(request.getTarget())
                .recruitField(request.getRecruitField())
                .prize(request.getPrize())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .linkUrl(request.getLinkUrl())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .build());
        return ContestDetailResponse.from(contest);
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = {"contestsPopular", "contestsList"}, allEntries = true),
            @CacheEvict(cacheNames = "contestsDetail", key = "#contestId")
    })
    @Transactional
    public ContestDetailResponse updateContest(Long contestId, ContestRequest request) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("공모전을 찾을 수 없습니다"));
        contest.update(
                request.getTitle(), request.getOrganizer(), request.getCategory(),
                request.getTarget(), request.getRecruitField(), request.getPrize(),
                request.getStartDate(), request.getEndDate(), request.getLinkUrl(),
                request.getContent(), request.getImageUrl());
        return ContestDetailResponse.from(contest);
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = {"contestsPopular", "contestsList"}, allEntries = true),
            @CacheEvict(cacheNames = "contestsDetail", key = "#contestId")
    })
    @Transactional
    public void deleteContest(Long contestId) {
        if (!contestRepository.existsById(contestId)) {
            throw new IllegalArgumentException("공모전을 찾을 수 없습니다");
        }
        contestRepository.deleteById(contestId);
    }

    @Transactional
    public void addContestHeart(Long userId, Long contestId) {
        if (contestHeartRepository.existsByUserIdAndContestId(userId, contestId)) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("공모전을 찾을 수 없습니다"));

        contestHeartRepository.save(ContestHeart.builder()
                .user(user)
                .contest(contest)
                .build());
    }

    @Transactional
    public void removeContestHeart(Long userId, Long contestId) {
        contestHeartRepository.findByUserIdAndContestId(userId, contestId)
                .ifPresent(contestHeartRepository::delete);
    }

    @Transactional(readOnly = true)
    public HeartedContestListResponse getHeartedContests(Long userId) {
        List<ContestListItemResponse> content = contestHeartRepository.findAllByUserId(userId).stream()
                .map(heart -> ContestListItemResponse.from(heart.getContest()))
                .collect(Collectors.toList());

        return HeartedContestListResponse.builder()
                .content(content)
                .build();
    }

    // override가 있으면(공모전 후보 등록·팀 직접 꾸리기 플로우에서 그 자리에서 수정한 값)
    // 그 값 그대로 스냅샷을 만든다 — 라이브 매칭 프로필은 전혀 조회하지 않는다.
    // override가 없으면(과거 호출 방식) 라이브 매칭 프로필을 읽어서 스냅샷을 만든다.
    // 매칭 프로필 자체는 오직 마이페이지 직접 편집(saveMatchingProfile)에서만 바뀌어야 한다.
    // 내부에서 user.setMatchingActive(true)를 호출해 인재풀 노출 여부를 바꾸므로,
    // UserService.setMatchingActive와 동일하게 userPool 캐시를 무효화해야 한다.
    @CacheEvict(cacheNames = "userPool", allEntries = true)
    @Transactional
    public void registerParticipant(Long contestId, Long userId, MatchingProfileData override) {
        // 이 사람이 이 공모전에 모집글을 올렸고 이미 팀원이 합류했다면 참여 카드(후보 등록)
        // 스냅샷을 못 바꾸게 막는다 — 그 모집글의 매칭 기준이 팀원 합류 이후 바뀌면 안 되므로
        // (PostService.updatePost의 팀원 유무 제약과 동일한 원칙)
        postRepository.findByOwnerIdAndContestId(userId, contestId).ifPresent(post -> {
            if (chatService.getCurrentMemberCount(post) > 1) {
                throw new IllegalStateException("이미 합류한 팀원이 있어서 참여 카드를 수정할 수 없습니다");
            }
        });

        Snapshot snap = override != null ? snapshotFromOverride(override) : snapshotFromLiveProfile(userId);

        // 이미 등록된 경우 스냅샷 업데이트(재등록 시 최신 카드 반영)
        contestParticipantRepository.findByContestIdAndUserId(contestId, userId).ifPresent(existing -> {
            existing.updateSnapshot(
                    snap.skillsCsv(), snap.experienceLevel(), snap.intensityLevel(), snap.onlineOfflinePref(),
                    snap.regionsSnapshot(), snap.teamVibe(), snap.feedbackStyle(), snap.leadershipPref(),
                    snap.participationPurpose(), snap.appealTitle(), snap.appealContent());
            contestParticipantRepository.save(existing);
        });
        if (contestParticipantRepository.existsByContestIdAndUserId(contestId, userId)) return;

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("공모전을 찾을 수 없습니다"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 후보 등록 시점의 카드 내용을 스냅샷으로 고정 저장
        contestParticipantRepository.save(ContestParticipant.builder()
                .contest(contest)
                .user(user)
                .skillsCsv(snap.skillsCsv())
                .experienceLevel(snap.experienceLevel())
                .intensityLevel(snap.intensityLevel())
                .onlineOfflinePref(snap.onlineOfflinePref())
                .regionsSnapshot(snap.regionsSnapshot())
                .teamVibe(snap.teamVibe())
                .feedbackStyle(snap.feedbackStyle())
                .leadershipPref(snap.leadershipPref())
                .participationPurpose(snap.participationPurpose())
                .appealTitle(snap.appealTitle())
                .appealContent(snap.appealContent())
                .build());

        // 매칭 활성화도 함께 처리
        user.setMatchingActive(true);
    }

    private record Snapshot(String skillsCsv, Integer experienceLevel, Integer intensityLevel,
                             String onlineOfflinePref, String regionsSnapshot, Integer teamVibe,
                             Integer feedbackStyle, String leadershipPref, String participationPurpose,
                             String appealTitle, String appealContent) {}

    private Snapshot snapshotFromLiveProfile(Long userId) {
        MatchingProfile profile = matchingProfileRepository.findByUserId(userId).orElse(null);
        List<MatchingProfileData.RegionInfo> regions = userRegionRepository.findAllByUserId(userId).stream()
                .map(r -> new MatchingProfileData.RegionInfo(r.getSido(), r.getSigungu()))
                .collect(Collectors.toList());
        return new Snapshot(
                profile != null ? profile.getSkillsCsv() : null,
                profile != null ? profile.getExperienceLevel() : null,
                profile != null ? profile.getIntensityLevel() : null,
                profile != null ? profile.getOnlineOfflinePref() : null,
                buildRegionsSnapshot(regions),
                profile != null ? profile.getTeamVibe() : null,
                profile != null ? profile.getFeedbackStyle() : null,
                profile != null ? profile.getLeadershipPref() : null,
                profile != null ? profile.getParticipationPurpose() : null,
                profile != null ? profile.getAppealTitle() : null,
                profile != null ? profile.getAppealContent() : null);
    }

    private Snapshot snapshotFromOverride(MatchingProfileData override) {
        String skillsCsv = (override.getSkills() != null && !override.getSkills().isEmpty())
                ? String.join(",", override.getSkills())
                : null;
        return new Snapshot(
                skillsCsv,
                override.getExperienceLevel(),
                override.getIntensityLevel(),
                override.getOnlineOfflinePref(),
                buildRegionsSnapshot(override.getRegions()),
                override.getTeamVibe(),
                override.getFeedbackStyle(),
                override.getLeadershipPref(),
                override.getParticipationPurpose(),
                override.getAppealTitle(),
                override.getAppealContent());
    }

    private String buildRegionsSnapshot(List<MatchingProfileData.RegionInfo> regions) {
        if (regions == null || regions.isEmpty()) return null;
        String joined = regions.stream()
                .map(r -> r.sido() + "|" + (r.sigungu() != null ? r.sigungu() : ""))
                .collect(Collectors.joining(";"));
        return joined.isEmpty() ? null : joined;
    }

    @Transactional
    public void cancelParticipant(Long contestId, Long userId) {
        contestParticipantRepository.deleteByContestIdAndUserId(contestId, userId);
    }

    @Transactional(readOnly = true)
    public boolean isParticipant(Long contestId, Long userId) {
        return contestParticipantRepository.existsByContestIdAndUserId(contestId, userId);
    }

    @Transactional(readOnly = true)
    public List<Long> getMyParticipationContestIds(Long userId) {
        return contestParticipantRepository.findAllByUserId(userId).stream()
                .map(p -> p.getContest().getId())
                .collect(Collectors.toList());
    }
}
