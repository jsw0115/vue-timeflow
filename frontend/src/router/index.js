import { createRouter, createWebHistory } from 'vue-router'

// 메인
import HomeView from '../views/home/HomeView.vue'
import NotificationsView from '../views/home/NotificationsView.vue'
import DdayView from '../views/home/DdayView.vue'
import CalendarView from '../views/home/CalendarView.vue'
import TagBoardView from '../views/tags/TagBoardView.vue'
import MentionBoxView from '../views/tags/MentionBoxView.vue'
import MyPostsView from '../views/tags/MyPostsView.vue'
import DdayDetailView from '../views/home/DdayDetailView.vue'

// 플래너
import PlannerDailyView from '../views/planner/PlannerDailyView.vue'
import PlannerWeeklyView from '../views/planner/PlannerWeeklyView.vue'
import PlannerMonthlyView from '../views/planner/PlannerMonthlyView.vue'
import PlannerYearlyView from '../views/planner/PlannerYearlyView.vue'
import PlannerTemplatesView from '../views/planner/PlannerTemplatesView.vue'
import ProjectCanvasView from '../views/planner/ProjectCanvasView.vue'
import FocusView from '../views/focus/FocusView.vue'
import CoFocusView from '../views/focus/CoFocusView.vue'

// 기록
import EventListView from '../views/events/EventListView.vue'
import DdayManageView from '../views/events/DdayManageView.vue'
import EventTemplatesView from '../views/events/EventTemplatesView.vue'
import TaskListView from '../views/tasks/TaskListView.vue'
import TaskDetailView from '../views/tasks/TaskDetailView.vue'
import RoutineListView from '../views/routines/RoutineListView.vue'
import RoutineHistoryView from '../views/routines/RoutineHistoryView.vue'
import DiaryListView from '../views/diary/DiaryListView.vue'
import DiaryEntryView from '../views/diary/DiaryEntryView.vue'
import DiarySummaryView from '../views/diary/DiarySummaryView.vue'
import MemoInboxView from '../views/memo/MemoInboxView.vue'
import MoneyLogView from '../views/money/MoneyLogView.vue'

// 인사이트
import StatsDailyView from '../views/stats/StatsDailyView.vue'
import StatsBoardView from '../views/stats/StatsBoardView.vue'
import StatsCategoryView from '../views/stats/StatsCategoryView.vue'
import StatsCompareView from '../views/stats/StatsCompareView.vue'
import StatsGodlifeView from '../views/stats/StatsGodlifeView.vue'
import AiInsightView from '../views/insight/AiInsightView.vue'
import WorkReportView from '../views/work/WorkReportView.vue'
import WorkHistoryView from '../views/work/WorkHistoryView.vue'
import LaborReportView from '../views/work/LaborReportView.vue'
import WorkWikiView from '../views/work/WorkWikiView.vue'
import WbsView from '../views/work/WbsView.vue'
import CareerDocsView from '../views/work/CareerDocsView.vue'

// 소셜
import FriendsView from '../views/share/FriendsView.vue'
import ShareGroupsView from '../views/share/ShareGroupsView.vue'
import SharedFilesView from '../views/share/SharedFilesView.vue'
import GroupDetailView from '../views/share/GroupDetailView.vue'
import ShareVisibilityView from '../views/share/ShareVisibilityView.vue'
import SharePreviewView from '../views/share/SharePreviewView.vue'
import BlockListView from '../views/share/BlockListView.vue'
import AddressBookView from '../views/address/AddressBookView.vue'
import ProfileCardView from '../views/address/ProfileCardView.vue'
import ChatListView from '../views/chat/ChatListView.vue'
import ChatRoomView from '../views/chat/ChatRoomView.vue'
import CommunityFeedView from '../views/community/CommunityFeedView.vue'
import CommunityHomeView from '../views/community/CommunityHomeView.vue'
import CommunityCreateView from '../views/community/CommunityCreateView.vue'
import JoinRequestView from '../views/community/JoinRequestView.vue'
import JoinApprovalsView from '../views/community/JoinApprovalsView.vue'
import MemberManageView from '../views/community/MemberManageView.vue'
import CommunityBoardView from '../views/community/CommunityBoardView.vue'
import CommunityChatView from '../views/community/CommunityChatView.vue'
import RankingView from '../views/community/RankingView.vue'
import ChallengeView from '../views/community/ChallengeView.vue'
import SyncStatusView from '../views/sync/SyncStatusView.vue'

// 설정

// 관리자
import AdminUsersView from '../views/admin/AdminUsersView.vue'
import AdminMonitoringView from '../views/admin/AdminMonitoringView.vue'
import AdminNoticesView from '../views/admin/AdminNoticesView.vue'
import AdminStatsView from '../views/admin/AdminStatsView.vue'
import AdminContentView from '../views/admin/AdminContentView.vue'
import AdminCsView from '../views/admin/AdminCsView.vue'
import AdminBillingView from '../views/admin/AdminBillingView.vue'
import AdminModerationView from '../views/admin/AdminModerationView.vue'
import AdminAuditView from '../views/admin/AdminAuditView.vue'
import AdminSettingsView from '../views/admin/AdminSettingsView.vue'

// 인증/온보딩 · 시스템 (사이드바 없는 bare 레이아웃)
import LoginView from '../views/auth/LoginView.vue'
import SignupView from '../views/auth/SignupView.vue'
import PasswordResetView from '../views/auth/PasswordResetView.vue'
import SocialLoginView from '../views/auth/SocialLoginView.vue'
import OnboardingView from '../views/auth/OnboardingView.vue'
import MaintenanceView from '../views/system/MaintenanceView.vue'
import PermissionRequestView from '../views/system/PermissionRequestView.vue'
import LegalViewerView from '../views/legal/LegalViewerView.vue'

// 화면 목록서 (기획 카탈로그, 기존 유지)
import ScreenDirectory from '../views/ScreenDirectory.vue'
import SettingsView from '../views/settings/SettingsView.vue'
import ScreenDetail from '../views/ScreenDetail.vue'

/**
 * navGroups: 사이드바에 섹션 헤더와 함께 그룹으로 렌더링되는 실제 내비게이션 트리.
 * 각 아이템의 title은 헤더 <h1> 서브타이틀, label은 route.meta.label(현재 표시용)로 쓰인다.
 */
export const navGroups = [
  {
    label: '메인',
    items: [
      { path: '/', name: '홈', icon: '⌂', component: HomeView, title: '오늘의 리듬을 시작해요' },
      { path: '/notifications', name: '알림', icon: '◈', component: NotificationsView, title: '초대·승인·시스템 알림을 확인해요' },
      { path: '/calendar', name: '캘린더', icon: '▦', component: CalendarView, title: '일정·D-Day·기록을 한눈에' },
      { path: '/dday', name: 'D-Day', icon: '◆', component: DdayView, title: '기다리는 순간을 모아봐요' },
      { path: '/mentions', name: '멘션함', icon: '@', component: MentionBoxView, title: '나를 언급한 글을 모아봐요' },
    ],
  },
  {
    label: '플래너',
    items: [
      { path: '/planner', name: '일간 플래너', icon: '▦', component: PlannerDailyView, title: '계획과 실제를 나란히' },
      { path: '/planner/weekly', name: '주간 플래너', icon: '▤', component: PlannerWeeklyView, title: '한 주의 흐름을 한눈에' },
      { path: '/planner/monthly', name: '월간 플래너', icon: '▥', component: PlannerMonthlyView, title: '한 달의 리듬을 돌아봐요' },
      { path: '/planner/yearly', name: '연간 개요', icon: '◑', component: PlannerYearlyView, title: '올해의 발자취를 모아봐요' },
      { path: '/planner/templates', name: '템플릿 관리', icon: '▧', component: PlannerTemplatesView, title: '자주 쓰는 하루를 저장해요' },
      { path: '/planner/canvas', name: '프로젝트 캔버스', icon: '▨', component: ProjectCanvasView, title: '프로젝트를 보드로 관리해요' },
      { path: '/focus', name: '집중 모드', icon: '◉', component: FocusView, title: '지금 이 순간에 몰입해요' },
      { path: '/focus/together', name: '같이 집중', icon: '◎', component: CoFocusView, title: '함께라서 더 잘 되는 집중' },
    ],
  },
  {
    label: '기록',
    items: [
      { path: '/events', name: '일정', icon: '◷', component: EventListView, title: '일정을 한눈에 관리해요' },
      { path: '/events/dday', name: 'D-Day 관리', icon: '◆', component: DdayManageView, title: '중요한 날짜를 관리해요' },
      { path: '/events/templates', name: '일정 템플릿', icon: '▧', component: EventTemplatesView, title: '자주 쓰는 일정을 저장해요' },
      { path: '/tasks', name: '할 일', icon: '✓', component: TaskListView, title: '오늘 해야 할 일' },
      { path: '/routines', name: '루틴', icon: '↻', component: RoutineListView, title: '작은 반복을 쌓아가요' },
      { path: '/routines/history', name: '루틴 히스토리', icon: '◔', component: RoutineHistoryView, title: '꾸준함의 기록' },
      { path: '/diary', name: '다이어리', icon: '✦', component: DiaryListView, title: '오늘을 기록해요' },
      { path: '/diary/summary', name: '기간 요약', icon: '▧', component: DiarySummaryView, title: '지난 기록을 요약해요' },
      { path: '/memos', name: '메모', icon: '▤', component: MemoInboxView, title: '생각을 놓치지 마세요 · 작성/변환은 모달로 열려요' },
      { path: '/tags', name: '태그 모아보기', icon: '#', component: TagBoardView, title: '해시태그로 글을 모아봐요' },
      { path: '/my-posts', name: '내 글', icon: '☰', component: MyPostsView, title: '내가 쓴 글을 모아봐요' },
      { path: '/money', name: '머니로그', icon: '₩', component: MoneyLogView, title: '수입과 지출을 기록해요' },
    ],
  },
  {
    label: '인사이트',
    items: [
      { path: '/stats', name: '통계 보드', icon: '◔', component: StatsBoardView, title: '포틀릿으로 내 통계를 구성해요' },
      { path: '/stats/daily', name: '일간 통계', icon: '◔', component: StatsDailyView, title: '내 리듬을 돌아봐요' },
      { path: '/stats/category', name: '카테고리 통계', icon: '◔', component: StatsCategoryView, title: '카테고리별 추이를 봐요' },
      { path: '/stats/compare', name: '비교 분석', icon: '⇄', component: StatsCompareView, title: 'Plan vs Actual 심층 분석' },
      { path: '/stats/godlife', name: '갓생 리포트', icon: '★', component: StatsGodlifeView, title: '이번 주 갓생 점수' },
      { path: '/insight', name: 'AI 리포트', icon: '✦', component: AiInsightView, title: 'AI가 발견한 나의 패턴' },
      { path: '/work', name: '업무 리포트', icon: '▧', component: WorkReportView, title: '업무 시간을 정리해요' },
      { path: '/work/history', name: '업무 히스토리', icon: '▤', component: WorkHistoryView, title: '업무 인수인계 기록' },
      { path: '/work/labor', name: '공수 계산', icon: '◔', component: LaborReportView, title: '인원·기간·투입률로 공수를 계산해요' },
      { path: '/work/wbs', name: 'WBS', icon: '⊞', component: WbsView, title: '작업을 분해하고 진척을 굴려요' },
      { path: '/work/wiki', name: '업무 위키', icon: '▤', component: WorkWikiView, title: '업무 지식을 문서로 쌓아요' },
      { path: '/work/career', name: '경력·포트폴리오', icon: '🔒', component: CareerDocsView, title: '나만 보는 경력 기록이에요' },
    ],
  },
  {
    label: '소셜',
    items: [
      { path: '/share', name: '공유', icon: '♧', component: FriendsView, title: '함께 쓰는 캘린더' },
      { path: '/share/groups', name: '캘린더 그룹', icon: '♧', component: ShareGroupsView, title: '그룹으로 일정을 공유해요' },
      { path: '/share/visibility', name: '공유 가시성', icon: '◑', component: ShareVisibilityView, title: '공개 범위를 설정해요' },
      { path: '/share/files', name: '공유 첨부', icon: '▣', component: SharedFilesView, title: '공유된 파일과 다운로드 기간을 관리해요' },
      { path: '/share/preview', name: '공유 프리뷰', icon: '▧', component: SharePreviewView, title: 'SNS 공유 이미지를 만들어요' },
      { path: '/share/blocked', name: '차단 목록', icon: '⊘', component: BlockListView, title: '차단한 사용자를 관리해요' },
      { path: '/address', name: '주소록', icon: '☺', component: AddressBookView, title: '친구·지인을 관리해요' },
      { path: '/chat', name: '채팅', icon: '✉', component: ChatListView, title: '대화를 이어가요' },
      { path: '/community', name: '커뮤니티', icon: '⌘', component: CommunityFeedView, title: '함께 갓생을 살아봐요' },
      { path: '/community/new', name: '커뮤니티 만들기', icon: '✎', component: CommunityCreateView, title: '새 커뮤니티를 만들어요' },
      { path: '/community/ranking', name: '랭킹', icon: '★', component: RankingView, title: '이번 주 달성률 랭킹' },
      { path: '/community/challenge', name: '커뮤니티 챌린지', icon: '◆', component: ChallengeView, title: '커뮤니티에서 함께하는 챌린지' },
      { path: '/sync', name: '동기화', icon: '⇄', component: SyncStatusView, title: '외부 캘린더와 동기화해요' },
    ],
  },
]

/**
 * 관리자 메뉴 — 사용자 LNB(navGroups)와 완전히 분리한다.
 * 관리자 화면은 AdminApp 셸에서만 렌더되므로 사용자 화면에 섞이지 않는다.
 */
export const adminGroups = [
  {
    label: '운영',
    items: [
      { path: '/admin', name: '사용자 관리', icon: '⌘', component: AdminUsersView, title: '사용자 계정을 관리해요' },
      { path: '/admin/cs', name: 'CS 관리', icon: '✉', component: AdminCsView, title: '1:1 문의를 처리해요' },
      { path: '/admin/billing', name: '구독/결제 관리', icon: '₩', component: AdminBillingView, title: '결제와 구독을 관리해요' },
      { path: '/admin/moderation', name: '커뮤니티 관리', icon: '⊘', component: AdminModerationView, title: '신고와 제재를 처리해요' },
    ],
  },
  {
    label: '콘텐츠',
    items: [
      { path: '/admin/content', name: '콘텐츠 관리', icon: '▦', component: AdminContentView, title: '명언·템플릿·스티커팩 관리' },
      { path: '/admin/notices', name: '공지/팝업', icon: '◈', component: AdminNoticesView, title: '공지와 팝업을 관리해요' },
    ],
  },
  {
    label: '시스템',
    items: [
      { path: '/admin/stats', name: '관리자 통계', icon: '◔', component: AdminStatsView, title: '서비스 지표를 확인해요' },
      { path: '/admin/logs', name: '로그/모니터링', icon: '▧', component: AdminMonitoringView, title: '시스템 상태를 모니터링해요' },
      { path: '/admin/audit', name: '감사 로그', icon: '◑', component: AdminAuditView, title: '관리자 조치 이력' },
      { path: '/admin/settings', name: '관리자 설정', icon: '⚙', component: AdminSettingsView, title: '서비스 정책과 권한을 설정해요' },
      { path: '/sitemap', name: '전체 화면', icon: '▥', component: ScreenDirectory, title: '기획된 화면을 모두 둘러봐요' },
    ],
  },
]
export const adminItems = adminGroups.flatMap((g) => g.items)

// 사이드바 없이 렌더링되는 화면 (인증/온보딩/시스템/법적 고지)
const bareRoutes = [
  { path: '/auth/login', name: '로그인', component: LoginView },
  { path: '/auth/signup', name: '회원가입', component: SignupView },
  { path: '/auth/reset-password', name: '비밀번호 재설정', component: PasswordResetView },
  { path: '/auth/social', name: '소셜 로그인 연동', component: SocialLoginView },
  { path: '/auth/onboarding', name: '온보딩', component: OnboardingView },
  { path: '/system/maintenance', name: '점검/업데이트 안내', component: MaintenanceView },
  { path: '/system/permission', name: '권한 요청', component: PermissionRequestView },
  { path: '/legal', name: '약관/정책 뷰어', component: LegalViewerView },
]

/** 하위 호환: 기존에 flat `navItems`를 참조하던 코드를 위해 평탄화한 배열도 함께 내보낸다 */
export const navItems = navGroups.flatMap((g) => g.items)

const routes = [
  ...navItems.map((item) => ({
    path: item.path,
    name: item.name,
    component: item.component,
    meta: { label: item.name, title: item.title },
  })),
  ...adminItems.map((item) => ({
    path: item.path,
    name: item.name,
    component: item.component,
    meta: { label: item.name, title: item.title, admin: true },
  })),
  ...bareRoutes.map((item) => ({
    path: item.path,
    name: item.name,
    component: item.component,
    meta: { label: item.name, title: item.name, bare: true },
  })),
  {
    path: '/screens/:id',
    name: '화면 상세',
    component: ScreenDetail,
    meta: { label: '전체 화면', title: '화면 상세', admin: true },
  },
  {
    path: '/dday/:id',
    name: 'D-Day 상세',
    component: DdayDetailView,
    meta: { label: 'D-Day', title: 'D-Day 상세·수정' },
  },
  // 상세 화면은 목록에서만 진입하므로 LNB에는 넣지 않는다(생성은 목록 화면의 모달이 담당)
  {
    path: '/tasks/:id',
    name: '할 일 상세',
    component: TaskDetailView,
    meta: { label: '할 일', title: '할 일 상세·수정' },
  },
  {
    path: '/share/groups/:id',
    name: '그룹 상세',
    component: GroupDetailView,
    meta: { label: '캘린더 그룹', title: '그룹 멤버 관리' },
  },

  // LNB에는 두지 않고 상위 화면의 탭·목록에서 진입하는 하위 화면들
  {
    path: '/community/home',
    name: '커뮤니티 홈',
    component: CommunityHomeView,
    meta: { label: '커뮤니티 홈', title: '커뮤니티 홈' },
  },
  {
    path: '/community/board',
    name: '커뮤니티 게시판',
    component: CommunityBoardView,
    meta: { label: '커뮤니티 게시판', title: '커뮤니티 인증 게시판' },
  },
  {
    path: '/community/members',
    name: '커뮤니티 멤버',
    component: MemberManageView,
    meta: { label: '커뮤니티 멤버', title: '커뮤니티 멤버와 권한을 관리해요' },
  },
  {
    path: '/community/chat',
    name: '커뮤니티 채팅',
    component: CommunityChatView,
    meta: { label: '커뮤니티 채팅', title: '커뮤니티 전용 채팅' },
  },
  {
    path: '/community/join',
    name: '커뮤니티 가입 신청',
    component: JoinRequestView,
    meta: { label: '커뮤니티 가입 신청', title: '커뮤니티 가입을 신청해요' },
  },
  {
    path: '/community/approvals',
    name: '커뮤니티 승인함',
    component: JoinApprovalsView,
    meta: { label: '커뮤니티 승인함', title: '커뮤니티 가입 요청을 관리해요' },
  },
  {
    path: '/chat/room',
    name: '채팅방',
    component: ChatRoomView,
    meta: { label: '채팅방', title: '대화방' },
  },
  {
    path: '/address/profile',
    name: '프로필 상세',
    component: ProfileCardView,
    meta: { label: '프로필 상세', title: '프로필 카드' },
  },
  {
    path: '/diary/entry',
    name: '일간 다이어리',
    component: DiaryEntryView,
    meta: { label: '일간 다이어리', title: '오늘의 기록' },
  },
  // 환경설정은 LNB 항목이 아니라 하나의 셸 화면이다. 구역은 그 안에서 고른다.
  {
    path: '/settings/:section?',
    name: '환경설정',
    component: SettingsView,
    meta: { label: '환경설정', title: '환경설정' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
