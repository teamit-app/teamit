package com.teamit.server.domain.post.service;

import com.teamit.server.domain.chat.dto.TeamMemberInfo;
import com.teamit.server.domain.chat.entity.ChatRoom;
import com.teamit.server.domain.chat.service.ChatService;
import com.teamit.server.domain.contest.entity.Contest;
import com.teamit.server.domain.contest.repository.ContestRepository;
import com.teamit.server.domain.contest.service.ContestService;
import com.teamit.server.domain.education.entity.Education;
import com.teamit.server.domain.education.repository.EducationRepository;
import com.teamit.server.domain.contest.entity.ContestParticipant;
import com.teamit.server.domain.contest.repository.ContestParticipantRepository;
import com.teamit.server.domain.post.dto.AddCommentRequest;
import com.teamit.server.domain.post.dto.CreatePostRequest;
import com.teamit.server.domain.post.dto.LikedPostResponse;
import com.teamit.server.domain.post.dto.PostCommentResponse;
import com.teamit.server.domain.post.dto.PostDetailResponse;
import com.teamit.server.domain.post.dto.PostListItemResponse;
import com.teamit.server.domain.post.dto.PostPageResponse;
import com.teamit.server.domain.post.dto.PostSortOption;
import com.teamit.server.domain.post.dto.RecruiterProfileInfo;
import com.teamit.server.domain.post.dto.RequiredSkillRequest;
import com.teamit.server.domain.post.dto.UpdatePostRequest;
import com.teamit.server.domain.post.entity.PostStatus;
import com.teamit.server.domain.matching.entity.PostApplication;
import com.teamit.server.domain.matching.repository.PostApplicationRepository;
import com.teamit.server.domain.matching.repository.TeamInvitationRepository;
import com.teamit.server.domain.notification.entity.NotificationType;
import com.teamit.server.domain.notification.service.NotificationService;
import com.teamit.server.domain.post.entity.Post;
import com.teamit.server.domain.post.entity.PostComment;
import com.teamit.server.domain.post.entity.PostHeart;
import com.teamit.server.domain.post.entity.PostSkill;
import com.teamit.server.domain.post.repository.PostCommentRepository;
import com.teamit.server.domain.post.repository.PostHeartRepository;
import com.teamit.server.domain.post.repository.PostRepository;
import com.teamit.server.domain.post.repository.PostSkillRepository;
import com.teamit.server.domain.post.repository.PostSpecifications;
import com.teamit.server.domain.review.repository.TeamReviewRepository;
import com.teamit.server.domain.region.entity.UserRegion;
import com.teamit.server.domain.region.repository.UserRegionRepository;
import com.teamit.server.domain.skill.entity.Skill;
import com.teamit.server.domain.skill.repository.SkillRepository;
import com.teamit.server.domain.user.dto.PostApplicantPageResponse;
import com.teamit.server.domain.user.dto.PostApplicantResponse;
import com.teamit.server.domain.user.entity.MatchingProfile;
import com.teamit.server.domain.user.entity.User;
import com.teamit.server.domain.user.entity.UserSkill;
import com.teamit.server.domain.user.repository.MatchingProfileRepository;
import com.teamit.server.domain.user.repository.UserRepository;
import com.teamit.server.domain.user.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final ContestRepository contestRepository;
    private final ContestService contestService;
    private final EducationRepository educationRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserRegionRepository userRegionRepository;
    private final MatchingProfileRepository matchingProfileRepository;
    private final PostSkillRepository postSkillRepository;
    private final SkillRepository skillRepository;
    private final PostHeartRepository postHeartRepository;
    private final PostCommentRepository postCommentRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final PostApplicationRepository postApplicationRepository;
    private final TeamInvitationRepository teamInvitationRepository;
    private final TeamReviewRepository teamReviewRepository;
    private final NotificationService notificationService;

    // 후보/지원자 카드에 표시할 평균 별점 — 온도(temperature) 플레이스홀더를 대체.
    // 후보/지원자 1명당 개별 조회하던 것을 배치 조회 + Map으로 바꿔서, 목록 크기와 무관하게
    // 쿼리 수를 고정한다(바로 위/아래 education/skill/region 배치조회와 동일한 패턴).
    private Map<Long, Double> averageRatingsOf(List<Long> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return teamReviewRepository.findByReceiverIdIn(userIds).stream()
                .collect(Collectors.groupingBy(
                        r -> r.getReceiver().getId(),
                        Collectors.averagingInt(com.teamit.server.domain.review.entity.TeamReview::getTotalRating)));
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 생성 → 팀 채팅방 자동 생성
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public PostListItemResponse createPost(Long userId, CreatePostRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        postRepository.findByOwnerIdAndContestId(userId, request.getContestId())
                .ifPresent(p -> {
                    throw new IllegalStateException("이미 이 공모전에 모집글을 작성했습니다");
                });

        Post post = postRepository.save(Post.builder()
                .owner(owner)
                .title(request.getTitle())
                .description(request.getDescription())
                .contestId(request.getContestId())
                .recruitCount(request.getRecruitCount())
                .deadline(request.getDeadline())
                .onlineOffline(request.getOnlineOffline())
                .genderCondition(request.getGenderCondition())
                .schoolCondition(request.getSchoolCondition())
                .experienceCondition(request.getExperienceCondition())
                .purposeCondition(request.getPurposeCondition())
                .build());

        // 모집글 생성과 동시에 팀 채팅방 생성 (모집자만 초기 멤버)
        ChatRoom teamChatRoom = chatService.createGroupChatRoom(
                post.getTitle() + " 팀", List.of(owner.getId()));
        post.assignChatRoom(teamChatRoom.getId());

        saveRequiredSkills(post, request.getRequiredSkills());

        // 모집글 작성 = 본인도 해당 공모전 팀 매칭 후보로 참여 의사를 밝힌 것 → 자동 후보 등록.
        // 여기선 override 없이(라이브 프로필 기준) 우선 등록해두고, 모바일 쪽에서 build-team
        // 플로우의 draft 카드가 있으면 곧바로 이어서 override로 다시 registerParticipant를
        // 호출해 스냅샷을 덮어쓴다(ContestController 참고).
        if (request.getContestId() != null) {
            contestService.registerParticipant(request.getContestId(), userId, null);
        }

        return buildListItems(List.of(post)).get(0);
    }

    private void saveRequiredSkills(Post post, List<RequiredSkillRequest> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) return;

        for (RequiredSkillRequest req : requiredSkills) {
            Skill skill = req.getSkillId() != null
                    ? skillRepository.findById(req.getSkillId()).orElse(null)
                    : null;
            postSkillRepository.save(PostSkill.builder()
                    .post(post)
                    .skill(skill)
                    .skillNameCustom(req.getSkillNameCustom())
                    .build());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // 공모전별 모집글 목록 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostListItemResponse> getPostsByContest(Long contestId) {
        return buildListItems(postRepository.findByContestIdOrderByCreatedAtDesc(contestId));
    }

    // ──────────────────────────────────────────────────────────────
    // 내 모집글 목록 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostListItemResponse> getMyPosts(Long userId) {
        return buildListItems(postRepository.findByOwnerIdOrderByCreatedAtDesc(userId));
    }

    // ──────────────────────────────────────────────────────────────
    // 전체 모집글 목록 조회 (홈 화면 / 탐색 탭 모집글 서브탭)
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PostPageResponse getPostList(PostSortOption sort, String keyword, int page, int size) {
        String sortProperty = sort == PostSortOption.POPULAR ? "viewCount" : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortProperty));
        Specification<Post> spec = Specification.where(PostSpecifications.keyword(keyword));
        Page<Post> postPage = postRepository.findAll(spec, pageable);

        List<PostListItemResponse> content = buildListItems(postPage.getContent());

        return PostPageResponse.builder()
                .content(content)
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .currentPage(postPage.getNumber())
                .build();
    }

    // 게시글 건당 개별 쿼리를 날리던 것(스킬/좋아요·댓글·지원자 수/공모전/채팅방 인원/지역 라벨)을
    // 전부 postIds 기준 배치 조회 + Map 매핑으로 바꿔서, 목록 크기와 무관하게 쿼리 수를 고정한다.
    private List<PostListItemResponse> buildListItems(List<Post> posts) {
        if (posts.isEmpty()) return List.of();

        List<Long> postIds = posts.stream().map(Post::getId).toList();
        List<Long> contestIds = posts.stream().map(Post::getContestId).filter(Objects::nonNull).distinct().toList();
        List<Long> chatRoomIds = posts.stream().map(Post::getChatRoomId).filter(Objects::nonNull).toList();
        List<Long> ownerIds = posts.stream().map(p -> p.getOwner().getId()).distinct().toList();

        Map<Long, List<String>> skillsByPostId = postSkillRepository.findAllByPostIdInWithSkill(postIds).stream()
                .collect(Collectors.groupingBy(ps -> ps.getPost().getId(),
                        Collectors.mapping(PostSkill::getEffectiveSkillName, Collectors.toList())));
        Map<Long, Long> likeCountMap = toCountMap(postHeartRepository.countGroupedByPostIdIn(postIds),
                PostHeartRepository.PostCountProjection::getPostId, PostHeartRepository.PostCountProjection::getCount);
        Map<Long, Long> commentCountMap = toCountMap(postCommentRepository.countGroupedByPostIdIn(postIds),
                PostCommentRepository.PostCountProjection::getPostId, PostCommentRepository.PostCountProjection::getCount);
        Map<Long, Long> applicantCountMap = toCountMap(postApplicationRepository.countGroupedByPostIdIn(postIds),
                PostApplicationRepository.PostCountProjection::getPostId, PostApplicationRepository.PostCountProjection::getCount);
        Map<Long, Contest> contestMap = contestIds.isEmpty() ? Map.of()
                : contestRepository.findAllById(contestIds).stream().collect(Collectors.toMap(Contest::getId, c -> c));
        Map<Long, Integer> memberCountMap = chatService.getCurrentMemberCounts(chatRoomIds);
        Map<List<Long>, String> regionLabelByContestAndOwner = buildOwnerRegionLabels(contestIds, ownerIds);
        // 목록 조회(getPostList)가 키워드 검색 지원을 위해 Specification 기반으로 바뀌면서
        // owner를 더 이상 JOIN FETCH하지 않는다 — post.getOwner().getGender() 같은 필드 접근이
        // 건당 추가 쿼리(N+1)를 내지 않도록, 다른 배치 조회들과 동일하게 한 번에 묶어서 가져온다.
        Map<Long, User> ownerMap = userRepository.findAllById(ownerIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return posts.stream().map(post -> {
            Contest contest = post.getContestId() != null ? contestMap.get(post.getContestId()) : null;
            String region = post.getContestId() != null
                    ? regionLabelByContestAndOwner.get(List.of(post.getContestId(), post.getOwner().getId()))
                    : null;
            return PostListItemResponse.from(post, ownerMap.get(post.getOwner().getId()),
                    memberCountMap.getOrDefault(post.getChatRoomId(), 0),
                    skillsByPostId.getOrDefault(post.getId(), List.of()),
                    region,
                    likeCountMap.getOrDefault(post.getId(), 0L),
                    commentCountMap.getOrDefault(post.getId(), 0L),
                    applicantCountMap.getOrDefault(post.getId(), 0L),
                    contest != null ? contest.getTitle() : null,
                    effectiveStatus(post, contest));
        }).toList();
    }

    private <T> Map<Long, Long> toCountMap(List<T> projections, Function<T, Long> idGetter, Function<T, Long> countGetter) {
        return projections.stream().collect(Collectors.toMap(idGetter, countGetter));
    }

    // 모집글에 표시되는 모집자 지역은 라이브 UserRegion이 아니라, 그 모집글이 속한 공모전에
    // 모집자 본인이 등록한 ContestParticipant 스냅샷 기준이어야 한다. 빈 라벨은 Map에 담지
    // 않아서 조회 시 없으면(getOrDefault 없이 get) null로 취급된다.
    private Map<List<Long>, String> buildOwnerRegionLabels(List<Long> contestIds, List<Long> ownerIds) {
        if (contestIds.isEmpty() || ownerIds.isEmpty()) return Map.of();
        Map<List<Long>, String> result = new HashMap<>();
        for (ContestParticipant cp : contestParticipantRepository.findAllByContestIdInAndUserIdIn(contestIds, ownerIds)) {
            String label = RecruiterProfileInfo.buildRegionLabel(cp.getRegionsSnapshot());
            if (!label.isEmpty()) {
                result.put(List.of(cp.getContest().getId(), cp.getUser().getId()), label);
            }
        }
        return result;
    }

    // 공모전이 마감(endDate 경과)되면 그 공모전에 속한 모집글도 더 이상 살아있으면 안 되므로,
    // DB에 CLOSED로 박아두지 않고 조회 시점마다 팀 확정 여부와 함께 동적으로 판단한다
    // (Contest 자체의 마감 여부를 판단하는 방식과 동일한 원칙 — ContestService 참고)
    private boolean isContestExpired(Contest contest) {
        return contest != null && contest.getEndDate() != null
                && contest.getEndDate().isBefore(LocalDate.now());
    }

    private String effectiveStatus(Post post, Contest contest) {
        boolean closed = post.getStatus() == PostStatus.CLOSED || isContestExpired(contest);
        return (closed ? PostStatus.CLOSED : PostStatus.OPEN).name();
    }

    // ──────────────────────────────────────────────────────────────
    // 좋아요한 모집글 목록 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<LikedPostResponse> getLikedPosts(Long userId) {
        List<PostHeart> hearts = postHeartRepository.findAllByUserId(userId);
        if (hearts.isEmpty()) return List.of();

        // heart.getPost()는 LAZY 프록시라 getId()만 안전하게 접근 가능(초기화 안 됨) —
        // title 등 실제 컬럼을 읽으려면 postRepository로 배치 로드해야 하트 건당
        // 지연로딩 쿼리가 발생하지 않는다.
        List<Long> postIds = hearts.stream().map(h -> h.getPost().getId()).toList();
        Map<Long, Post> postMap = postRepository.findAllById(postIds).stream()
                .collect(Collectors.toMap(Post::getId, p -> p));
        List<Post> posts = postIds.stream().map(postMap::get).filter(Objects::nonNull).toList();

        List<Long> contestIds = posts.stream().map(Post::getContestId).filter(Objects::nonNull).distinct().toList();
        Map<Long, List<String>> rolesByPostId = postSkillRepository.findAllByPostIdInWithSkill(postIds).stream()
                .collect(Collectors.groupingBy(ps -> ps.getPost().getId(),
                        Collectors.mapping(PostSkill::getEffectiveSkillName, Collectors.toList())));
        Map<Long, Contest> contestMap = contestIds.isEmpty() ? Map.of()
                : contestRepository.findAllById(contestIds).stream().collect(Collectors.toMap(Contest::getId, c -> c));

        return posts.stream()
                .map(post -> buildLikedPost(post, contestMap.get(post.getContestId()),
                        rolesByPostId.getOrDefault(post.getId(), List.of())))
                .toList();
    }

    private LikedPostResponse buildLikedPost(Post post, Contest contest, List<String> roles) {
        return LikedPostResponse.builder()
                .postId(post.getId())
                .contestId(post.getContestId())
                .contestTitle(contest != null ? contest.getTitle() : null)
                .postTitle(post.getTitle())
                .roles(roles)
                .teamSize(post.getRecruitCount() != null ? post.getRecruitCount() : 0)
                .deadline(post.getDeadline())
                .dDay(parseDDay(post.getDeadline()))
                .isOpen(!isContestExpired(contest) && post.getStatus() == PostStatus.OPEN)
                .build();
    }

    private long parseDDay(String deadline) {
        if (deadline == null || deadline.isBlank()) return 0;
        try {
            return ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(deadline));
        } catch (Exception e) {
            return 0;
        }
    }


    // ──────────────────────────────────────────────────────────────
    // 모집글 단건 조회
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public PostDetailResponse getPostDetail(Long postId, Long viewerUserId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        post.increaseViewCount();

        Contest contest = post.getContestId() != null
                ? contestRepository.findById(post.getContestId()).orElse(null)
                : null;
        String contestTitle = contest != null ? contest.getTitle() : null;
        String contestPeriod = buildContestPeriod(contest);

        List<String> skills = postSkillRepository.findAllByPostIdWithSkill(postId).stream()
                .map(PostSkill::getEffectiveSkillName)
                .collect(Collectors.toList());

        List<TeamMemberInfo> members = chatService.getTeamMembers(post);

        RecruiterProfileInfo recruiter = buildRecruiterProfile(post.getOwner(), post.getContestId());

        long likeCount = postHeartRepository.countByPostId(postId);
        long commentCount = postCommentRepository.countByPostId(postId);
        boolean isHearted = viewerUserId != null && postHeartRepository.existsByUserIdAndPostId(viewerUserId, postId);
        Long myApplicationId = viewerUserId == null ? null : postApplicationRepository
                .findByPostIdAndApplicantId(postId, viewerUserId)
                .map(PostApplication::getId)
                .orElse(null);

        return PostDetailResponse.from(post, contestTitle, contestPeriod, skills, members, recruiter,
                likeCount, commentCount, isHearted, myApplicationId, effectiveStatus(post, contest));
    }

    private String buildContestPeriod(Contest contest) {
        if (contest == null || contest.getEndDate() == null) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy.MM.dd");
        if (contest.getStartDate() != null) {
            return contest.getStartDate().format(fmt) + " ~ " + contest.getEndDate().format(fmt);
        }
        return "~ " + contest.getEndDate().format(fmt);
    }

    private RecruiterProfileInfo buildRecruiterProfile(User owner, Long contestId) {
        ContestParticipant cp = contestId != null
                ? contestParticipantRepository.findByContestIdAndUserId(contestId, owner.getId()).orElse(null)
                : null;
        return RecruiterProfileInfo.fromSnapshot(owner, cp);
    }

    // ──────────────────────────────────────────────────────────────
    // 팀 확정 (모집자만 가능)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void confirmTeam(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        if (!post.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("팀 확정 권한이 없습니다");
        }
        // 모집자 본인만 있는 상태로 확정하면 리뷰 대상이 없어 이후 리뷰 작성 단계에서 오류가 난다
        if (chatService.getCurrentMemberCount(post) <= 1) {
            throw new IllegalStateException("합류한 팀원이 없어 팀을 확정할 수 없습니다");
        }
        post.confirmTeam();

        List<Long> memberIds = chatService.getMemberUserIds(post.getChatRoomId());
        notificationService.notifyAllIfEnabled(memberIds, NotificationType.MATCH_SUCCESS,
                "팀이 확정됐어요", "\"" + post.getTitle() + "\" 팀이 확정됐어요", post.getId(), "POST");
    }

    // ──────────────────────────────────────────────────────────────
    // 후보 목록 조회 — 하드필터 + 소프트 스코어링
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostApplicantResponse> getCandidates(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        Long ownerUserId = post.getOwner().getId();

        if (post.getContestId() == null) return List.of();

        // 모집자 데이터 — 학력은 스냅샷 대상이 아니라 라이브 그대로, 지역/매칭 성향은
        // 모집자 본인이 이 공모전에 등록한 ContestParticipant 스냅샷 기준으로 한다.
        // 후보 매칭 기준이 모집글을 만든 시점 그대로 고정되도록(라이브 프로필은 이후 바뀔 수 있음).
        Education ownerEdu = educationRepository.findByUserId(ownerUserId).orElse(null);
        ContestParticipant ownerCp = contestParticipantRepository
                .findByContestIdAndUserId(post.getContestId(), ownerUserId).orElse(null);
        Set<String> ownerSidos = parseRegionSidos(ownerCp != null ? ownerCp.getRegionsSnapshot() : null);

        // 모집글 필요 기술명 (소문자 정규화)
        List<String> requiredSkills = postSkillRepository.findAllByPostIdWithSkill(postId).stream()
                .map(ps -> ps.getEffectiveSkillName().toLowerCase())
                .collect(Collectors.toList());

        // 해당 공모전 후보 등록자만 (모집자 제외) — ContestParticipant 스냅샷 활용
        List<ContestParticipant> contestParticipants = contestParticipantRepository
                .findCandidates(post.getContestId(), ownerUserId);

        if (contestParticipants.isEmpty()) return List.of();

        List<Long> candidateIds = contestParticipants.stream()
                .map(cp -> cp.getUser().getId())
                .collect(Collectors.toList());

        // 등록 시점 스냅샷 맵 — 라이브 프로필/스킬/지역 대신 이걸로 필터링·스코어링·표시까지 전부 처리
        Map<Long, ContestParticipant> cpSnapshotMap = contestParticipants.stream()
                .collect(Collectors.toMap(cp -> cp.getUser().getId(), cp -> cp));

        List<User> allCandidates = userRepository.findAllById(candidateIds);

        // 학력만 라이브로 배치 로드 (UI 표시용, 스냅샷 대상이 아님)
        Map<Long, Education> educationMap = educationRepository.findByUserIdIn(candidateIds).stream()
                .collect(Collectors.toMap(e -> e.getUser().getId(), e -> e));
        Map<Long, Double> ratingMap = averageRatingsOf(candidateIds);

        record ScoredUser(User user, double score) {}

        return allCandidates.stream()
                .filter(u -> passesHardFilters(u, post, ownerEdu, ownerSidos, educationMap, cpSnapshotMap))
                .map(u -> new ScoredUser(u, computeMatchScore(u, requiredSkills, ownerCp, post, cpSnapshotMap)))
                .sorted(Comparator.comparingDouble(ScoredUser::score).reversed())
                .map(sc -> PostApplicantResponse.fromSnapshot(
                        sc.user(),
                        educationMap.get(sc.user().getId()),
                        cpSnapshotMap.get(sc.user().getId()),
                        ratingMap.getOrDefault(sc.user().getId(), 0.0),
                        (int) Math.round(sc.score())
                ))
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────
    // 전체 후보 조회 — 하드필터·스코어링 없이 이 공모전에 등록된 모든 후보를 그대로,
    // 페이징으로. 초기엔 매칭 조건에 맞는 인원이 적을 수 있어 "매칭된 후보" 아래에
    // 함께 보여주기 위함
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PostApplicantPageResponse getAllCandidates(Long postId, int page, int size) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        Long ownerUserId = post.getOwner().getId();

        if (post.getContestId() == null) {
            return PostApplicantPageResponse.builder()
                    .content(List.of()).totalElements(0).totalPages(0).currentPage(page).build();
        }

        Page<ContestParticipant> cpPage = contestParticipantRepository
                .findAllCandidatesPaged(post.getContestId(), ownerUserId, PageRequest.of(page, size));

        List<Long> candidateIds = cpPage.getContent().stream()
                .map(cp -> cp.getUser().getId())
                .collect(Collectors.toList());

        Map<Long, User> userMap = userRepository.findAllById(candidateIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<Long, Education> educationMap = educationRepository.findByUserIdIn(candidateIds).stream()
                .collect(Collectors.toMap(e -> e.getUser().getId(), e -> e));
        Map<Long, Double> ratingMap = averageRatingsOf(candidateIds);

        List<PostApplicantResponse> content = cpPage.getContent().stream()
                .map(cp -> PostApplicantResponse.fromSnapshot(
                        userMap.get(cp.getUser().getId()),
                        educationMap.get(cp.getUser().getId()),
                        cp,
                        ratingMap.getOrDefault(cp.getUser().getId(), 0.0)
                ))
                .collect(Collectors.toList());

        return PostApplicantPageResponse.builder()
                .content(content)
                .totalElements(cpPage.getTotalElements())
                .totalPages(cpPage.getTotalPages())
                .currentPage(cpPage.getNumber())
                .build();
    }

    private Set<String> parseRegionSidos(String regionsSnapshot) {
        if (regionsSnapshot == null || regionsSnapshot.isBlank()) return Set.of();
        return Arrays.stream(regionsSnapshot.split(";"))
                .map(entry -> entry.split("\\|", -1)[0])
                .collect(Collectors.toSet());
    }

    // ──────────────────────────────────────────────────────────────
    // 지원자 목록 조회 — 해당 모집글에 직접 지원한 사람들
    // ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PostApplicantResponse> getApplicants(Long postId, Long requestingUserId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        if (!post.getOwner().getId().equals(requestingUserId)) {
            throw new IllegalArgumentException("조회 권한이 없습니다");
        }

        List<PostApplication> applications = postApplicationRepository.findAllByPostId(postId);
        if (applications.isEmpty()) return List.of();

        List<Long> applicantIds = applications.stream()
                .map(a -> a.getApplicant().getId())
                .collect(Collectors.toList());

        List<User> applicants = userRepository.findAllById(applicantIds);

        Map<Long, Education> educationMap = educationRepository.findByUserIdIn(applicantIds).stream()
                .collect(Collectors.toMap(e -> e.getUser().getId(), e -> e));
        Map<Long, List<UserSkill>> skillMap = userSkillRepository.findAllByUserIdInWithSkill(applicantIds).stream()
                .collect(Collectors.groupingBy(us -> us.getUser().getId()));
        Map<Long, List<UserRegion>> regionMap = userRegionRepository.findAllByUserIdIn(applicantIds).stream()
                .collect(Collectors.groupingBy(r -> r.getUser().getId()));
        Map<Long, MatchingProfile> profileMap = matchingProfileRepository.findAllByUserIdIn(applicantIds).stream()
                .collect(Collectors.toMap(mp -> mp.getUser().getId(), mp -> mp));
        Map<Long, Double> ratingMap = averageRatingsOf(applicantIds);

        return applicants.stream()
                .map(u -> PostApplicantResponse.from(
                        u,
                        educationMap.get(u.getId()),
                        skillMap.getOrDefault(u.getId(), List.of()),
                        regionMap.getOrDefault(u.getId(), List.of()),
                        profileMap.get(u.getId()),
                        ratingMap.getOrDefault(u.getId(), 0.0)
                ))
                .collect(Collectors.toList());
    }

    private boolean passesHardFilters(User candidate, Post post,
                                       Education ownerEdu, Set<String> ownerSidos,
                                       Map<Long, Education> educationMap,
                                       Map<Long, ContestParticipant> cpSnapshotMap) {
        ContestParticipant cp = cpSnapshotMap.get(candidate.getId());

        // 1. 성별 조건
        if ("SAME".equals(post.getGenderCondition())) {
            if (candidate.getGender() == null || post.getOwner().getGender() == null) return false;
            if (!candidate.getGender().equals(post.getOwner().getGender())) return false;
        }

        // 2. 온오프라인 조건 (스냅샷에 pref 없으면 필터 스킵)
        String postMeeting = post.getOnlineOffline();
        if (postMeeting != null && cp != null && cp.getOnlineOfflinePref() != null) {
            String pref = cp.getOnlineOfflinePref();
            if ("ONLINE".equals(postMeeting)) {
                if (!"ONLINE".equals(pref)) return false;
            } else {
                // OFFLINE 또는 MIXED: 후보도 OFFLINE/MIXED이어야 하고, 활동지역(둘 다 등록 시점
                // 스냅샷 기준) 겹쳐야 함
                if (!"OFFLINE".equals(pref) && !"MIXED".equals(pref)) return false;
                if (!ownerSidos.isEmpty()) {
                    Set<String> candidateSidos = parseRegionSidos(cp.getRegionsSnapshot());
                    boolean overlap = candidateSidos.stream().anyMatch(ownerSidos::contains);
                    if (!overlap) return false;
                }
            }
        }

        // 3. 학교 조건
        if ("SAME_SCHOOL".equals(post.getSchoolCondition())) {
            if (ownerEdu == null) return false;
            Education candidateEdu = educationMap.get(candidate.getId());
            if (candidateEdu == null) return false;
            if (!ownerEdu.getSchoolName().equals(candidateEdu.getSchoolName())) return false;
        }

        // 4. 경험 조건 (0=처음, 1=경험있어요, 2=베테랑)
        if ("공모전 경험자 선호".equals(post.getExperienceCondition())) {
            if (cp == null || cp.getExperienceLevel() == null || cp.getExperienceLevel() < 1) return false;
        }

        return true;
    }

    // 네 가지 매칭 요소(기술 매칭/참여 강도 일치/협업 스타일 유사도/참여 목적 일치)가
    // 총점에 동일한 비율(각 25점 만점)로 기여하도록 정규화한 스코어링. 데이터가 없는 요소는
    // 가/감점 없이 중립으로 스킵한다(있는 후보를 없는 후보보다 부당하게 낮추지 않기 위함).
    private static final double SCORE_WEIGHT = 25.0;

    private double computeMatchScore(User candidate, List<String> requiredSkills,
                                      ContestParticipant ownerCp, Post post,
                                      Map<Long, ContestParticipant> cpSnapshotMap) {
        ContestParticipant cp = cpSnapshotMap.get(candidate.getId());
        double score = 0;

        // 1. 기술 매칭 (필요 스킬 대비 보유 비율) — 후보 스킬도 그 공모전 등록 스냅샷 기준
        List<String> candidateSkills = (cp != null && cp.getSkillsCsv() != null && !cp.getSkillsCsv().isBlank())
                ? Arrays.stream(cp.getSkillsCsv().split(","))
                        .map(s -> s.trim().toLowerCase())
                        .collect(Collectors.toList())
                : List.of();
        if (!requiredSkills.isEmpty()) {
            long skillMatch = requiredSkills.stream().filter(candidateSkills::contains).count();
            score += (skillMatch / (double) requiredSkills.size()) * SCORE_WEIGHT;
        }

        if (cp != null && ownerCp != null) {
            // 2. 참여 강도 일치
            if (ownerCp.getIntensityLevel() != null
                    && ownerCp.getIntensityLevel().equals(cp.getIntensityLevel())) {
                score += SCORE_WEIGHT;
            }
            // 3. 협업 스타일 유사도 (teamVibe/feedbackStyle은 1~5 스케일, 최대 차이 4)
            if (ownerCp.getTeamVibe() != null && cp.getTeamVibe() != null
                    && ownerCp.getFeedbackStyle() != null && cp.getFeedbackStyle() != null) {
                double vibeDiff = Math.abs(ownerCp.getTeamVibe() - cp.getTeamVibe());
                double feedbackDiff = Math.abs(ownerCp.getFeedbackStyle() - cp.getFeedbackStyle());
                double avgDiff = (vibeDiff + feedbackDiff) / 2.0;
                score += (1 - avgDiff / 4.0) * SCORE_WEIGHT;
            }
        }

        // 4. 참여 목적 일치 (모집자가 "참여 조건 설정"에서 우대 조건으로 지정했을 때만 가산)
        String wantedPurpose = "경험 선호".equals(post.getPurposeCondition()) ? "EXPERIENCE"
                : "수상 선호".equals(post.getPurposeCondition()) ? "AWARD"
                : null;
        if (wantedPurpose != null && cp != null && wantedPurpose.equals(cp.getParticipationPurpose())) {
            score += SCORE_WEIGHT;
        }

        return score;
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 좋아요
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void addPostHeart(Long userId, Long postId) {
        if (postHeartRepository.existsByUserIdAndPostId(userId, postId)) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));

        postHeartRepository.save(PostHeart.builder()
                .user(user)
                .post(post)
                .build());
    }

    @Transactional
    public void removePostHeart(Long userId, Long postId) {
        postHeartRepository.findByUserIdAndPostId(userId, postId)
                .ifPresent(postHeartRepository::delete);
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 댓글
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public PostCommentResponse addComment(Long postId, Long userId, AddCommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        PostComment parent = request.getParentId() != null
                ? postCommentRepository.findById(request.getParentId()).orElse(null)
                : null;

        PostComment saved = postCommentRepository.save(PostComment.builder()
                .post(post)
                .author(author)
                .content(request.getContent())
                .parent(parent)
                .build());

        return PostCommentResponse.from(saved, post.getOwner().getId());
    }

    @Transactional(readOnly = true)
    public List<PostCommentResponse> getComments(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        Long postOwnerId = post.getOwner().getId();

        List<PostComment> all = postCommentRepository.findAllByPostIdOrderByCreatedAtAsc(postId);

        // 답글이 작성 시각과 무관하게 항상 원댓글 바로 아래에 오도록 부모 기준으로 묶어서 재배열
        Map<Long, List<PostComment>> repliesByParentId = all.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId()));

        List<PostCommentResponse> result = new ArrayList<>();
        for (PostComment comment : all) {
            if (comment.getParent() != null) continue;
            result.add(PostCommentResponse.from(comment, postOwnerId));
            for (PostComment reply : repliesByParentId.getOrDefault(comment.getId(), List.of())) {
                result.add(PostCommentResponse.from(reply, postOwnerId));
            }
        }
        return result;
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 수정 (작성자만 가능)
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void updatePost(Long postId, Long userId, UpdatePostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        if (!post.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다");
        }

        // 이미 합류한 팀원이 있으면 모집 조건이 바뀌면 안 되므로(합류 당시 기준과 어긋남)
        // 어필글(제목/본문)만 수정 가능 — 클라이언트가 다른 필드를 보내도 서버에서 무시한다
        boolean hasTeamMembers = chatService.getCurrentMemberCount(post) > 1;
        if (hasTeamMembers) {
            post.update(request.getTitle(), request.getDescription());
            return;
        }

        post.updateFull(request.getTitle(), request.getDescription(), request.getRecruitCount(),
                request.getOnlineOffline(), request.getGenderCondition(),
                request.getSchoolCondition(), request.getExperienceCondition(),
                request.getPurposeCondition());

        if (request.getRequiredSkills() != null) {
            postSkillRepository.deleteAllByPostId(postId);
            saveRequiredSkills(post, request.getRequiredSkills());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // 모집글 삭제 (작성자만 가능) — 연결된 채팅방도 함께 삭제되고,
    // 지원자·팀원에게 알림이 발송된다
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("모집글을 찾을 수 없습니다"));
        if (!post.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다");
        }
        deletePostCascade(post);
    }

    // ──────────────────────────────────────────────────────────────
    // 채팅방 삭제(방장 전용, ChatController에서 호출) — 연결된 모집글을 찾아
    // 위와 동일한 삭제 로직을 태운다
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void deletePostByChatRoom(Long chatRoomId, Long userId) {
        Post post = postRepository.findByChatRoomId(chatRoomId)
                .orElseThrow(() -> new IllegalArgumentException("연결된 모집글을 찾을 수 없습니다"));
        if (!post.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다");
        }
        deletePostCascade(post);
    }

    // ──────────────────────────────────────────────────────────────
    // 공모전 팀 매칭 후보 등록 취소 시 호출(ContestController) — 모집글 작성이
    // 후보 등록을 자동으로 만든 것과 대칭으로, 후보 등록을 취소하면 그때 함께
    // 생성됐던 모집글도 같이 정리한다. 없으면 아무 것도 하지 않는다.
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void deleteMyPostForContest(Long contestId, Long userId) {
        postRepository.findByOwnerIdAndContestId(userId, contestId)
                .ifPresent(this::deletePostCascade);
    }

    // ──────────────────────────────────────────────────────────────
    // 회원 탈퇴 시 호출(UserService.withdraw) — 소유한 모집글을 전부 동일한 cascade로 정리
    // ──────────────────────────────────────────────────────────────
    @Transactional
    public void deleteAllPostsByOwner(Long ownerId) {
        postRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .forEach(this::deletePostCascade);
    }

    private void deletePostCascade(Post post) {
        Long postId = post.getId();
        String title = post.getTitle();
        Long chatRoomId = post.getChatRoomId();
        Long ownerId = post.getOwner().getId();

        // 삭제로 지워지기 전에 알림 대상부터 확보
        // (엔티티가 아니라 id만 조회 — 아래 bulk delete들과 섞이면서 영속성 컨텍스트에
        // stale 엔티티가 남아 TransientPropertyValueException이 나는 걸 방지)
        List<Long> applicantIds = postApplicationRepository.findApplicantIdsByPostId(postId).stream()
                .distinct()
                .collect(Collectors.toList());
        List<Long> teamMemberIds = chatRoomId != null
                ? chatService.getMemberUserIds(chatRoomId).stream()
                        .filter(id -> !id.equals(ownerId))
                        .collect(Collectors.toList())
                : List.of();

        // FK 참조 순서대로 자식 레코드 먼저 삭제
        teamInvitationRepository.deleteAllByPostId(postId);
        postApplicationRepository.deleteAllByPostId(postId);
        postHeartRepository.deleteAllByPostId(postId);
        postCommentRepository.nullifyParentsByPostId(postId); // 대댓글 자기참조 FK 해제
        postCommentRepository.deleteAllByPostId(postId);
        postSkillRepository.deleteAllByPostId(postId);
        postRepository.delete(post);

        if (chatRoomId != null) {
            chatService.deleteChatRoom(chatRoomId);
        }

        for (Long applicantId : applicantIds) {
            notificationService.notify(applicantId, NotificationType.ANNOUNCEMENT,
                    "지원한 모집글이 삭제됐어요",
                    "\"" + title + "\" 모집글이 삭제되어 지원 내역이 취소됐어요.",
                    postId, "POST");
        }
        for (Long memberId : teamMemberIds) {
            notificationService.notify(memberId, NotificationType.ANNOUNCEMENT,
                    "팀 채팅방이 삭제됐어요",
                    "\"" + title + "\" 팀의 모집글과 채팅방이 삭제됐어요.",
                    postId, "POST");
        }
    }
}
