# 현재 화면 경로 목록

작성일 2026-10-31. 수정일 2026-10-31. Vue 라우터의 명시적 경로와 플래너 매핑을 정적으로 추출한 생성 문서입니다.

경로 86개입니다. 동일 컴포넌트의 여러 경로·선택 파라미터를 별개 목록 행으로 표시합니다. 라우트 개수는 기능 완성도나 실제 접근 권한·서버 연결 검증 수가 아닙니다. 설정의 section별 탭과 모달은 별도 경로로 세지 않습니다.

상세 입력·레이아웃·상태·흐름은 [화면 명세](screen-design.md)에 관리합니다. 화면 카탈로그 데이터의 기획 항목과 실제 라우트는 다를 수 있습니다.

## 목차

- [화면 목록](#화면-목록)
- [재생성](#재생성)

## 화면 목록

| 경로 | 표시 역할 | 컴포넌트 소스 | 확인할 경계 |
| --- | --- | --- | --- |
| `/` | 홈 | [HomeView](../../frontend/src/views/home/HomeView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/address` | 주소록 | [AddressBookView](../../frontend/src/views/address/AddressBookView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/address/profile` | 프로필 상세 | [ProfileCardView](../../frontend/src/views/address/ProfileCardView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/admin` | 사용자 관리 | [AdminUsersView](../../frontend/src/views/admin/AdminUsersView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/audit` | 감사 로그 | [AdminAuditView](../../frontend/src/views/admin/AdminAuditView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/billing` | 구독/결제 관리 | [AdminBillingView](../../frontend/src/views/admin/AdminBillingView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/content` | 콘텐츠 관리 | [AdminContentView](../../frontend/src/views/admin/AdminContentView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/cs` | CS 관리 | [AdminCsView](../../frontend/src/views/admin/AdminCsView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/logs` | 로그/모니터링 | [AdminMonitoringView](../../frontend/src/views/admin/AdminMonitoringView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/moderation` | 커뮤니티 관리 | [AdminModerationView](../../frontend/src/views/admin/AdminModerationView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/notices` | 공지/팝업 | [AdminNoticesView](../../frontend/src/views/admin/AdminNoticesView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/settings` | 관리자 설정 | [AdminSettingsView](../../frontend/src/views/admin/AdminSettingsView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/admin/stats` | 관리자 통계 | [AdminStatsView](../../frontend/src/views/admin/AdminStatsView.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/auth/login` | 로그인 | [LoginView](../../frontend/src/views/auth/LoginView.vue) | 가입·로그인 서버 연결과 화면별 실제 저장 확인 |
| `/auth/onboarding` | 온보딩 | [OnboardingView](../../frontend/src/views/auth/OnboardingView.vue) | 가입·로그인 서버 연결과 화면별 실제 저장 확인 |
| `/auth/reset-password` | 비밀번호 재설정 | [PasswordResetView](../../frontend/src/views/auth/PasswordResetView.vue) | 화면 존재와 제공자 실행 가능 여부 구분 |
| `/auth/signup` | 회원가입 | [SignupView](../../frontend/src/features/auth/views/SignupView.vue) | 가입·로그인 서버 연결과 화면별 실제 저장 확인 |
| `/auth/social` | 소셜 로그인 연동 | [SocialLoginView](../../frontend/src/views/auth/SocialLoginView.vue) | 화면 존재와 제공자 실행 가능 여부 구분 |
| `/calendar` | 캘린더 | [CalendarView](../../frontend/src/views/home/CalendarView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/chat` | 채팅 | [ChatListView](../../frontend/src/features/chat/views/ChatWorkspace.vue) | 인증 API·채팅 시연·개인 기록 출처 구분 |
| `/chat/mentions` | 채팅 멘션 | [ChatInbox](../../frontend/src/features/inbox/views/UnifiedInbox.vue) | 인증 API·채팅 시연·개인 기록 출처 구분 |
| `/chat/room` | 채팅방 | [ChatRoomView](../../frontend/src/views/chat/ChatRoomView.vue) | 인증 API·채팅 시연·개인 기록 출처 구분 |
| `/chat/tags` | 채팅 태그 | [ChatInbox](../../frontend/src/features/inbox/views/UnifiedInbox.vue) | 인증 API·채팅 시연·개인 기록 출처 구분 |
| `/community` | 커뮤니티 | [CommunityFeedView](../../frontend/src/views/community/CommunityFeedView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/approvals` | 커뮤니티 승인함 | [JoinApprovalsView](../../frontend/src/views/community/JoinApprovalsView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/board` | 커뮤니티 게시판 | [CommunityBoardView](../../frontend/src/views/community/CommunityBoardView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/challenge` | 커뮤니티 챌린지 | [ChallengeView](../../frontend/src/views/community/ChallengeView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/chat` | 커뮤니티 채팅 | [CommunityChatView](../../frontend/src/views/community/CommunityChatView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/home` | 커뮤니티 홈 | [CommunityHomeView](../../frontend/src/views/community/CommunityHomeView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/join` | 커뮤니티 가입 신청 | [JoinRequestView](../../frontend/src/views/community/JoinRequestView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/members` | 커뮤니티 멤버 | [MemberManageView](../../frontend/src/views/community/MemberManageView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/new` | 커뮤니티 만들기 | [CommunityCreateView](../../frontend/src/views/community/CommunityCreateView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/community/ranking` | 랭킹 | [RankingView](../../frontend/src/views/community/RankingView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/dday` | D-Day | [DdayView](../../frontend/src/views/home/DdayView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/dday/:id` | D-Day 상세 | [DdayDetailView](../../frontend/src/views/home/DdayDetailView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/diary` | 다이어리 | [DiaryListView](../../frontend/src/views/diary/DiaryListView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/diary/entry` | 일간 다이어리 | [DiaryEntryView](../../frontend/src/views/diary/DiaryEntryView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/diary/summary` | 기간 요약 | [DiarySummaryView](../../frontend/src/views/diary/DiarySummaryView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/events` | 일정 | [EventListView](../../frontend/src/views/events/EventListView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/events/dday` | D-Day 관리 | [DdayManageView](../../frontend/src/views/events/DdayManageView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/events/templates` | 일정 템플릿 | [EventTemplatesView](../../frontend/src/views/events/EventTemplatesView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/focus` | 집중 모드 | [FocusView](../../frontend/src/views/focus/FocusView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/focus/together` | 같이 집중 | [CoFocusView](../../frontend/src/views/focus/CoFocusView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/insight` | AI 리포트 | [AiInsightView](../../frontend/src/views/insight/AiInsightView.vue) | 화면 존재와 제공자 실행 가능 여부 구분 |
| `/legal` | 약관/정책 뷰어 | [LegalViewerView](../../frontend/src/views/legal/LegalViewerView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/memos` | 메모 | [MemoInboxView](../../frontend/src/views/memo/MemoInboxView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/mentions` | 멘션함 | [ChatInbox](../../frontend/src/features/inbox/views/UnifiedInbox.vue) | 인증 API·채팅 시연·개인 기록 출처 구분 |
| `/money` | 머니로그 | [MoneyLogView](../../frontend/src/views/money/MoneyLogView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/my-posts` | 내 글 | [MyPostsView](../../frontend/src/views/tags/MyPostsView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/notifications` | 알림 | [NotificationsView](../../frontend/src/views/home/NotificationsView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/planner` | 플래너 | [PlannerDailyView](../../frontend/src/views/planner/PlannerDailyView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/planner/canvas` | 프로젝트 캔버스 | [ProjectCanvasView](../../frontend/src/views/planner/ProjectCanvasView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/planner/daily` | 플래너 일간 | [PlannerDailyView](../../frontend/src/views/planner/PlannerDailyView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/planner/monthly` | 플래너 월간 | [PlannerMonthlyView](../../frontend/src/views/planner/PlannerMonthlyView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/planner/templates` | 템플릿 관리 | [PlannerTemplatesView](../../frontend/src/views/planner/PlannerTemplatesView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/planner/weekly` | 플래너 주간 | [PlannerWeeklyView](../../frontend/src/views/planner/PlannerWeeklyView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/planner/yearly` | 플래너 연간 | [PlannerYearlyView](../../frontend/src/views/planner/PlannerYearlyView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/routines` | 루틴 | [RoutineListView](../../frontend/src/views/routines/RoutineListView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/routines/history` | 루틴 히스토리 | [RoutineHistoryView](../../frontend/src/views/routines/RoutineHistoryView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/screens/:id` | 화면 상세 | [ScreenDetail](../../frontend/src/views/ScreenDetail.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/settings/:section?` | 환경설정 | [SettingsView](../../frontend/src/views/settings/SettingsView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/share` | 공유 | [FriendsView](../../frontend/src/views/share/FriendsView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/share/blocked` | 차단 목록 | [BlockListView](../../frontend/src/views/share/BlockListView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/share/files` | 공유 첨부 | [SharedFilesView](../../frontend/src/views/share/SharedFilesView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/share/groups` | 캘린더 그룹 | [ShareGroupsView](../../frontend/src/views/share/ShareGroupsView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/share/groups/:id` | 그룹 상세 | [GroupDetailView](../../frontend/src/views/share/GroupDetailView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/share/preview` | 공유 프리뷰 | [SharePreviewView](../../frontend/src/views/share/SharePreviewView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/share/visibility` | 공유 가시성 | [ShareVisibilityView](../../frontend/src/views/share/ShareVisibilityView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/sitemap` | 전체 화면 | [ScreenDirectory](../../frontend/src/views/ScreenDirectory.vue) | 관리자 셸·서버 ADMIN·운영 프록시 확인 |
| `/stats` | 통계 보드 | [StatsBoardView](../../frontend/src/views/stats/StatsBoardView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/stats/category` | 카테고리 통계 | [StatsCategoryView](../../frontend/src/views/stats/StatsCategoryView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/stats/compare` | 비교 분석 | [StatsCompareView](../../frontend/src/views/stats/StatsCompareView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/stats/daily` | 일간 통계 | [StatsDailyView](../../frontend/src/views/stats/StatsDailyView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/stats/godlife` | 갓생 리포트 | [StatsGodlifeView](../../frontend/src/views/stats/StatsGodlifeView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/sync` | 동기화 | [SyncStatusView](../../frontend/src/views/sync/SyncStatusView.vue) | 화면 존재와 제공자 실행 가능 여부 구분 |
| `/system/maintenance` | 점검/업데이트 안내 | [MaintenanceView](../../frontend/src/views/system/MaintenanceView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/system/permission` | 권한 요청 | [PermissionRequestView](../../frontend/src/views/system/PermissionRequestView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/tags` | 태그 모아보기 | [ChatInbox](../../frontend/src/features/inbox/views/UnifiedInbox.vue) | 인증 API·채팅 시연·개인 기록 출처 구분 |
| `/tasks` | 할 일 | [TaskListView](../../frontend/src/views/tasks/TaskListView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/tasks/:id` | 할 일 상세 | [TaskDetailView](../../frontend/src/views/tasks/TaskDetailView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/work` | 업무 리포트 | [WorkReportView](../../frontend/src/views/work/WorkReportView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/work/career` | 경력·포트폴리오 | [CareerDocsView](../../frontend/src/views/work/CareerDocsView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/work/history` | 업무 히스토리 | [WorkHistoryView](../../frontend/src/views/work/WorkHistoryView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/work/labor` | 공수 계산 | [LaborReportView](../../frontend/src/views/work/LaborReportView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/work/wbs` | WBS | [WbsView](../../frontend/src/views/work/WbsView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |
| `/work/wiki` | 업무 위키 | [WorkWikiView](../../frontend/src/views/work/WorkWikiView.vue) | 로컬 store·API·소유권·갱신 실패를 실제 호출로 확인 |

## 재생성

```powershell
python scripts/docs/build_screen_catalog.py
python scripts/docs/build_screen_catalog.py --check
```

동적으로 구성하는 라우터로 바뀌면 이 정적 추출기를 함께 수정하고 실제 화면 이동을 별도 검증합니다.
