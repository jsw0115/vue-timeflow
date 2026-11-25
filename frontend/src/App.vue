<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navGroups } from './router'
import { isGroupCollapsed, setGroupCollapsed } from './store/navCollapse'
import { localeState, setBodyLocale, tr } from './store/locale'
import { formatDate, groupLabel, modeText, navName, navTitle, shellText } from './features/i18n/locale.mjs'
import { documentLang } from './features/i18n/translatedRoutes.mjs'
import { composer, openPostComposer } from './store/appState'
import PostComposer from './components/PostComposer.vue'
import LocalMigrationPrompt from './components/LocalMigrationPrompt.vue'
import OutboxPanel from './components/OutboxPanel.vue'
import NoticeBanner from './components/NoticeBanner.vue'
import './store/postIndex'
import { storageWarning } from './store/localCollection'
import { communityComposer } from './store/communities'
import CommunityCreateModal from './components/CommunityCreateModal.vue'
import { modeState, modeMeta, applyWeekdayMode } from './store/modeProfiles'
import { favoriteMenus, initNavFavorites } from './store/navFavorites'
import { dayBoundary } from './features/records/dayBoundary.mjs'
import { accountToday } from './features/quickInput/parseQuickInput.mjs'
import GlobalSearchModal from './components/GlobalSearchModal.vue'
import ProfileModal from './components/ProfileModal.vue'
import SidePanel from './components/SidePanel.vue'
import FloatingChat from './features/chat/components/FloatingChat.vue'
import PlannerViewSettings from './components/PlannerViewSettings.vue'
import { togglePanel, unreadNotifications } from './store/people'
import { hasUnreadMentions } from './features/chat/model/chatStore'
import BrandMark from './components/brand/BrandMark.vue'
import AppIcon from './components/icons/AppIcon.vue'
import { NAV_ICONS } from './components/icons/iconPaths.mjs'
import { session } from './features/auth/session.js'
import { apiRequest } from './features/auth/apiRequest.js'
import { themeState, THEMES, ACCENTS } from './store/theme'
import { createThemeAccount, sameTheme } from './features/settings/themeAccount.mjs'
import { unreadMentions as unreadPostMentions } from './store/tagging'
import { adminAccess, refreshAdminAccess } from './features/admin/admin.js'

const route = useRoute()
const router = useRouter()
const mobileNav = ref(false)
const isBare = computed(() => route.meta?.bare === true)
const isChat = computed(() => route.path === '/chat' || route.path.startsWith('/chat/') || ['/mentions', '/tags'].includes(route.path))
// 화면 대표 행동 자리(components/PageActions.vue). 헤더가 있을 때만 헤더 오른쪽으로 옮기고, 화면이 대표 행동을 내놓으면 좁은 화면에서 전역 '새 글 작성'을 접는다.
const pageActionCount = ref(0)
provide('pageActionSlot', {
  available: computed(() => !isBare.value && !isChat.value),
  register: () => { pageActionCount.value += 1 },
  unregister: () => { pageActionCount.value = Math.max(0, pageActionCount.value - 1) },
})
// 페이지 헤더(DESIGN.md 5장 Page composition): 현재 위치(메뉴 묶음) → 화면 이름 제목 → 짧은 설명.
// 예전에는 제목 자리에 화면 문구(meta.title)를 보였다. 이제 문구는 설명으로 내리고 제목은 화면 이름이다.
// 표시 언어(PR-32 1단계): 사이드바·머리글 문구만 바꾸고 화면 본문은 한국어 그대로다. 바뀐 부분에만 lang을 붙인다
const locale = computed(() => localeState.locale)
const t = (key, vars) => shellText(key, locale.value, vars)
// 본문까지 옮긴 화면에서만 문서 언어와 본문 문구(tr)를 바꾼다(대화 상자 포함). 나머지 화면은 본문이 한국어라 ko다
watch(() => [locale.value, route.path], () => {
  const lang = documentLang(locale.value, route.path)
  setBodyLocale(lang)
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}, { immediate: true })
const todayLabel = computed(() => formatDate(new Date(), locale.value))
const currentNav = computed(() => navGroups.flatMap((group) => group.items).find((item) => item.path === route.path))
const modeName = (mode) => modeText(mode, locale.value, modeMeta(mode)).name
const pageName = computed(() => {
  if (route.name === '화면 상세') return route.params.id ? `${route.params.id} 화면 미리보기` : '화면 상세'
  if (route.name === '홈') return t('today')
  if (route.path.startsWith('/settings')) return t('settings')
  if (currentNav.value) return navName(currentNav.value, locale.value)
  // 메뉴에 없는 화면(플래너 일·주·월·연 등)은 라우트 이름표를 본문 언어로 보인다
  return route.name ? tr(route.name) : route.meta?.label ? tr(route.meta.label) : ''
})
const pageDesc = computed(() => {
  if (route.path.startsWith('/settings')) return ''
  const desc = route.name === '홈' ? todayLabel.value : currentNav.value ? navTitle(currentNav.value, locale.value) : route.meta?.title ? tr(route.meta.title) : ''
  return desc === pageName.value ? '' : desc
})
const pageGroup = computed(() => {
  if (route.path.startsWith('/settings')) return t('settings')
  // 정확히 일치하는 메뉴의 묶음을 먼저 찾는다. 상세 화면처럼 메뉴에 없는 경로만 접두어로 찾는다(/work/history가 /work 묶음으로 잡히지 않게)
  return (navGroups.find((group) => group.items.some((item) => isNavActive(item)))
    ?? navGroups.find((group) => group.items.some((item) => route.path.startsWith(item.path + '/'))))?.label ?? ''
})
const pageGroupText = computed(() => groupLabel(pageGroup.value, locale.value))
// 머리글은 메뉴에 있는 화면·홈·환경설정만 옮긴다. 상세 화면 제목은 한국어 그대로라 그때는 lang을 붙이지 않는다
const headingLang = computed(() => (locale.value !== 'ko' && (currentNav.value || route.name === '홈' || route.path.startsWith('/settings')) ? locale.value : undefined))
// 사이드바 계정 영역은 로그인한 계정만 보인다. 로그아웃이면 로그인 안내다(시연 계정을 실제 계정처럼 보이지 않는다).
const accountName = computed(() => session.nickname || session.email || '내 계정')
const accountInitial = computed(() => (accountName.value || '나').trim().slice(0, 1).toUpperCase())

// 계정에 저장한 화면 테마가 있으면 로그인할 때 그 테마를 쓴다(다른 기기에서 적용한 테마). 저장한 적이 없거나 서버에 닿지 못하면 이 브라우저 테마를 그대로 둔다.
const themeAccount = createThemeAccount({ request: apiRequest, keys: { surfaces: Object.keys(THEMES), accents: Object.keys(ACCENTS) } })
watch(() => session.userId, async (id) => {
  if (!id) return
  try {
    const saved = await themeAccount.load()
    if (saved && session.userId === id && !sameTheme(saved, themeState)) Object.assign(themeState, saved)
  } catch { /* 이 브라우저 테마를 그대로 쓴다 */ }
}, { immediate: true })
// 관리자 콘솔 진입 버튼은 서버가 관리자 권한을 확인한 계정에만 보인다. 메뉴 숨김은 보안 통제가 아니며 관리자 API는 서버가 매 요청 검사한다(docs/design 03 §8-5, 09 §2)
watch(() => session.userId, (id) => refreshAdminAccess(Boolean(id)), { immediate: true })
const canOpenAdmin = computed(() => adminAccess.state === 'allowed')
function isNavActive(item) {
  if (item.path === '/planner') return ['/planner', '/planner/daily', '/planner/weekly', '/planner/monthly', '/planner/yearly'].includes(route.path)
  return route.path === item.path
}

// 메뉴 즐겨찾기(UF-131): 사이드바 맨 위 바로가기. 원래 묶음의 메뉴는 그대로 둔다
initNavFavorites(navGroups)
const favorites = computed(() => favoriteMenus())

// 묶음 접힘은 store/navCollapse.js가 이 브라우저에 저장한다(시작 구성과 함께 쓴다)
function toggleGroup(label) {
  if (label === '플래너') {
    setGroupCollapsed(label, false)
    void router.push('/planner')
    return
  }
  setGroupCollapsed(label, !isGroupCollapsed(label))
}
// 지금 보고 있는 화면이 속한 그룹은 접혀 있어도 자동으로 펼쳐서, 현재 위치를 놓치지 않게 한다
watch(
  () => route.path,
  () => {
    const activeGroup = navGroups.find((g) => g.items.some((item) => isNavActive(item)))
    if (activeGroup && isGroupCollapsed(activeGroup.label)) setGroupCollapsed(activeGroup.label, false)
  },
  { immediate: true },
)

// 우측 상단 고정 액션바: 통합검색 모달, 공유 바로가기, 빠른 기록(퀵 캡처)
const showSearch = ref(false)
function goSearch() {
  showSearch.value = true
}

/**
 * 관리자 화면은 앱 안(iframe/라우터)에서 열지 않고 별도 창으로 띄운다.
 * 같은 이름("timeflow-admin")으로 열기 때문에, 이미 열려 있으면 새 창을 만들지 않고 그 창으로 포커스가 간다.
 */
let adminWindow = null
function openAdmin(path) {
  if (adminWindow && !adminWindow.closed) {
    adminWindow.focus()
    if (path) adminWindow.location.href = new URL(path, window.location.origin).href
    return
  }
  adminWindow = window.open(new URL(path, window.location.origin).href, 'timeflow-admin')
  adminWindow?.focus()
}

const workspaceOpen = ref(false)
function changeMode(mode) { modeState.activeMode = mode; workspaceOpen.value = false }
// 평일·주말 기본 모드(UF-133): 앱을 열 때, 1분마다, 화면으로 돌아올 때, 계정 하루 기준을 불러온 뒤 확인한다
const checkWeekdayMode = () => applyWeekdayMode(accountToday({ timeZone: dayBoundary.state.timeZone, startHour: dayBoundary.state.startHour }))
const onVisible = () => { if (document.visibilityState === 'visible') checkWeekdayMode() }
let weekdayTimer
onMounted(() => { checkWeekdayMode(); weekdayTimer = setInterval(checkWeekdayMode, 60000); document.addEventListener('visibilitychange', onVisible) })
onBeforeUnmount(() => { clearInterval(weekdayTimer); document.removeEventListener('visibilitychange', onVisible) })
watch(() => [dayBoundary.state.timeZone, dayBoundary.state.startHour, modeState.weekdaySchedule.appliedFor, modeState.weekdaySchedule.enabled], checkWeekdayMode)
function openComposer() {
  const kind = route.path.startsWith('/tasks') ? '할 일' : route.path.startsWith('/diary') ? '다이어리' : route.path.startsWith('/memos') ? '메모' : route.path.startsWith('/routines') ? '루틴' : route.path.startsWith('/money') ? '머니로그' : route.path.startsWith('/dday') || route.path === '/events/dday' ? 'D-Day' : route.path === '/work/wiki' ? '업무 위키' : route.path === '/work/wbs' ? '업무 기록' : '일정'
  openPostComposer(kind)
}
watch(() => route.path, () => { mobileNav.value = false; workspaceOpen.value = false })
</script>

<template>
  <router-view v-if="isBare" />
  <div v-else class="app">
    <aside class="sidebar" :class="{ open: mobileNav }" :lang="locale">
      <router-link to="/" class="brand" :aria-label="t('homeLink')"><BrandMark class="brand-mark" label="" /><span class="brand-name">Timebar Diary</span></router-link>
      <div class="workspace-switcher" @keydown.esc.stop="workspaceOpen = false" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (workspaceOpen = false)">
      <button class="workspace" aria-controls="workspace-options" :aria-expanded="workspaceOpen" @click="workspaceOpen = !workspaceOpen"><i>{{ modeState.activeMode }}</i><span><b>{{ t('dayMode') }}</b><small>{{ modeName(modeState.activeMode) }}</small></span><em class="workspace-chev" aria-hidden="true"><AppIcon name="chevronDown" :size="16" /></em></button>
      <div v-if="workspaceOpen" id="workspace-options" class="workspace-options" :aria-label="t('chooseDayMode')">
        <p>{{ t('chooseDayModeHelp') }}</p>
        <button v-for="mode in ['J', 'P', 'B']" :key="mode" :aria-pressed="modeState.activeMode === mode" @click="changeMode(mode)">{{ modeName(mode) }}<span v-if="modeState.activeMode === mode">{{ t('selected') }}</span></button>
      </div></div>
      <nav>
        <template v-if="favorites.length">
          <div class="nav-section nav-favorites-head">{{ t('favorites') }}<router-link to="/settings/menu" class="nav-favorites-edit" :aria-label="t('editFavorites')" @click="mobileNav = false">{{ t('edit') }}</router-link></div>
          <router-link v-for="item in favorites" :key="'fav:' + item.path" :to="item.path" custom v-slot="{ navigate }">
            <button :class="{ active: isNavActive(item) }" :aria-current="isNavActive(item) ? 'page' : undefined" @click="navigate(); mobileNav = false">
              <span class="nav-icon"><AppIcon :name="NAV_ICONS[item.path]" :fallback="item.icon" /></span><span class="nav-text">{{ navName(item, locale) }}</span>
            </button>
          </router-link>
        </template>
        <template v-for="group in navGroups" :key="group.label">
          <button type="button" class="nav-section" :class="{ collapsed: isGroupCollapsed(group.label) }" :aria-expanded="group.label === '플래너' ? undefined : !isGroupCollapsed(group.label)" @click="toggleGroup(group.label)">
            {{ groupLabel(group.label, locale) }}<i class="chev" aria-hidden="true"><AppIcon name="chevronDown" :size="14" /></i>
          </button>
          <template v-if="!isGroupCollapsed(group.label)">
            <template v-for="item in group.items.filter(item => !['/chat', '/planner'].includes(item.path))" :key="item.path">
              <router-link :to="item.path" custom v-slot="{ navigate }">
                <button :class="{ active: isNavActive(item) }" :aria-current="isNavActive(item) ? 'page' : undefined" @click="item.path === '/community/new' ? (communityComposer = true) : navigate(); mobileNav = false">
                  <span class="nav-icon"><AppIcon :name="NAV_ICONS[item.path]" :fallback="item.icon" /></span><span class="nav-text">{{ navName(item, locale) }}</span>
                </button>
              </router-link>
            </template>
          </template>
        </template>
      </nav>

      <!-- 스크롤과 무관하게 항상 보이는 하단 고정 영역 -->
      <div class="nav-footer">
        <!-- 환경설정은 항목을 LNB에 늘어놓지 않고 버튼 하나로 들어간다 -->
        <router-link to="/settings" custom v-slot="{ navigate }">
          <button class="nav-link" :class="{ active: route.path.startsWith('/settings') }" :aria-current="route.path.startsWith('/settings') ? 'page' : undefined" @click="navigate(); mobileNav = false">
            <span class="nav-icon"><AppIcon name="sliders" /></span><span class="nav-text">{{ t('settings') }}</span>
          </button>
        </router-link>
        <!-- 관리자 콘솔은 사용자 화면과 분리된 별도 창으로 연다 -->
        <button v-if="canOpenAdmin" class="nav-link" @click="openAdmin('/admin'); mobileNav = false">
          <span class="nav-icon"><AppIcon name="shield" /></span><span class="nav-text">{{ t('adminConsole') }}</span><small class="nav-ext" :aria-label="t('newWindow')"><AppIcon name="external" :size="14" /></small>
        </button>
      </div>
      <router-link v-if="session.userId" to="/settings/profile" class="account"><i aria-hidden="true">{{ accountInitial }}</i><span><b>{{ accountName }}</b><small>{{ session.email || t('viewProfile') }}</small></span></router-link>
      <router-link v-else to="/auth/login" class="account"><i aria-hidden="true">?</i><span><b>{{ t('signIn') }}</b><small>{{ t('signInHelp') }}</small></span></router-link>
    </aside>
    <div v-if="mobileNav" class="scrim" @click="mobileNav = false"></div>
    <main :class="{ 'chat-shell': isChat }">
      <div v-if="isChat" class="chat-mobile-menu"><button :aria-label="t('openFullMenu')" @click="mobileNav = true"><AppIcon name="menu" /></button><span :lang="locale">{{ t('chatTitle') }}</span></div>
      <header v-else>
        <button class="hamburger" :aria-label="t('openMenu')" @click="mobileNav = true"><AppIcon name="menu" /></button>
        <div class="page-heading" :lang="headingLang">
          <p v-if="pageGroup" class="eyebrow">{{ pageGroupText }}</p>
          <h1>{{ pageName }}</h1>
          <p v-if="pageDesc" class="page-desc">{{ pageDesc }}</p>
        </div>
        <div class="actions" :lang="locale">
          <button class="icon" :title="t('search')" :aria-label="t('search')" @click="goSearch"><AppIcon name="search" /></button>
          <button class="icon icon-badge" :title="t('notifications')" :aria-label="unreadNotifications ? t('unreadNotifications', { n: unreadNotifications }) : t('notifications')" @click="togglePanel('notif')">
            <AppIcon name="bell" /><em v-if="unreadNotifications">{{ unreadNotifications }}</em>
          </button>
          <router-link to="/mentions" custom v-slot="{ navigate }">
            <button class="icon icon-badge" :title="t('mentions')" :aria-label="hasUnreadMentions || unreadPostMentions ? t('mentionsUnread') : t('mentions')" @click="navigate">
              <AppIcon name="at" /><em v-if="hasUnreadMentions || unreadPostMentions" :aria-label="t('unreadMentions')">N</em>
            </button>
          </router-link>
          <!-- 화면당 주 버튼 하나(DESIGN.md 4장 Buttons). 홈에서만 주 버튼이고, 다른 화면에서는 그 화면의 주 행동을 가리지 않도록 보조 버튼이다 -->
          <button :class="[route.name === '홈' ? 'primary' : 'button-secondary', { 'compose-collapsible': pageActionCount > 0 }]" @click="openComposer"><span aria-hidden="true">+</span>{{ t('newPost') }}</button>
          <div id="page-actions" class="page-actions"></div>
        </div>
      </header>
      <NoticeBanner v-if="!isChat" />
      <p v-if="storageWarning" class="callout" role="alert">{{ storageWarning }}</p>
      <OutboxPanel />
      <PlannerViewSettings v-if="['/planner/daily', '/planner/weekly', '/planner/monthly', '/planner/yearly'].includes(route.path)" />
      <p v-if="route.path === '/chat'" class="callout" :lang="locale">{{ t('chatCallout') }}</p>
      <router-view v-else />
    </main>
    <GlobalSearchModal v-if="showSearch" @close="showSearch = false" />
    <SidePanel />
    <ProfileModal />
    <PostComposer v-if="composer" />
    <LocalMigrationPrompt />
    <CommunityCreateModal v-if="communityComposer" @close="communityComposer = false" />
  </div>
  <FloatingChat />
</template>
