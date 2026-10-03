<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navGroups } from './router'
import { composer, openPostComposer } from './store/appState'
import PostComposer from './components/PostComposer.vue'
import './store/postIndex'
import { storageWarning } from './store/localCollection'
import { communityComposer } from './store/communities'
import CommunityCreateModal from './components/CommunityCreateModal.vue'
import { modeState, modeMeta } from './store/modeProfiles'
import GlobalSearchModal from './components/GlobalSearchModal.vue'
import ProfileModal from './components/ProfileModal.vue'
import SidePanel from './components/SidePanel.vue'
import FloatingChat from './features/chat/components/FloatingChat.vue'
import PlannerViewSettings from './components/PlannerViewSettings.vue'
import { togglePanel, unreadNotifications } from './store/people'
import { hasUnreadMentions } from './features/chat/model/chatStore'
import { unreadMentions as unreadPostMentions } from './store/tagging'

const route = useRoute()
const router = useRouter()
const mobileNav = ref(false)
const isBare = computed(() => route.meta?.bare === true)
const isChat = computed(() => route.path === '/chat' || route.path.startsWith('/chat/') || ['/mentions', '/tags'].includes(route.path))
const pageTitle = computed(() => {
  if (route.name === '화면 상세') return route.params.id ? `${route.params.id} 화면 미리보기` : '화면 상세'
  return route.meta?.title ?? ''
})
function isNavActive(item) {
  if (item.path === '/planner') return ['/planner', '/planner/daily', '/planner/weekly', '/planner/monthly', '/planner/yearly'].includes(route.path)
  return route.path === item.path
}

const COLLAPSED_GROUPS_KEY = 'timeflow.nav.collapsedGroups'
function loadCollapsedGroups() {
  try {
    const raw = localStorage.getItem(COLLAPSED_GROUPS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}
const collapsedGroups = reactive(loadCollapsedGroups())
function persistCollapsedGroups() {
  try {
    localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify([...collapsedGroups]))
  } catch {
    // localStorage를 쓸 수 없는 환경(시크릿 모드 등)에서는 세션 내 상태만 유지
  }
}
function isGroupCollapsed(label) {
  return collapsedGroups.has(label)
}
function toggleGroup(label) {
  if (label === '플래너') {
    collapsedGroups.delete(label)
    persistCollapsedGroups()
    void router.push('/planner')
    return
  }
  if (collapsedGroups.has(label)) collapsedGroups.delete(label)
  else collapsedGroups.add(label)
  persistCollapsedGroups()
}
// 지금 보고 있는 화면이 속한 그룹은 접혀 있어도 자동으로 펼쳐서, 현재 위치를 놓치지 않게 한다
watch(
  () => route.path,
  () => {
    const activeGroup = navGroups.find((g) => g.items.some((item) => isNavActive(item)))
    if (activeGroup && collapsedGroups.has(activeGroup.label)) {
      collapsedGroups.delete(activeGroup.label)
      persistCollapsedGroups()
    }
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
function openComposer() {
  const kind = route.path.startsWith('/tasks') ? '할 일' : route.path.startsWith('/diary') ? '다이어리' : route.path.startsWith('/memos') ? '메모' : route.path.startsWith('/routines') ? '루틴' : route.path.startsWith('/money') ? '머니로그' : route.path.startsWith('/dday') || route.path === '/events/dday' ? 'D-Day' : route.path === '/community/board' ? '커뮤니티 글' : route.path === '/work/wiki' ? '업무 위키' : route.path === '/work/wbs' ? '업무 기록' : '일정'
  openPostComposer(kind)
}
watch(() => route.path, () => { mobileNav.value = false; workspaceOpen.value = false })
const todayLabel = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(new Date())
</script>

<template>
  <router-view v-if="isBare" />
  <div v-else class="app">
    <aside class="sidebar" :class="{ open: mobileNav }">
      <div class="brand"><b>t</b>timebar</div>
      <div class="workspace-switcher" @keydown.esc.stop="workspaceOpen = false" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (workspaceOpen = false)">
      <button class="workspace" aria-controls="workspace-options" :aria-expanded="workspaceOpen" @click="workspaceOpen = !workspaceOpen"><i>{{ modeState.activeMode }}</i><span><b>지수의 하루</b><small>{{ modeMeta(modeState.activeMode).name }}</small></span>⌄</button>
      <div v-if="workspaceOpen" id="workspace-options" class="workspace-options" aria-label="하루 모드 선택">
        <p>하루를 보내는 방식을 선택하세요</p>
        <button v-for="mode in ['J', 'P', 'B']" :key="mode" :aria-pressed="modeState.activeMode === mode" @click="changeMode(mode)">{{ modeMeta(mode).name }}<span v-if="modeState.activeMode === mode">선택됨</span></button>
      </div></div>
      <nav>
        <template v-for="group in navGroups" :key="group.label">
          <button type="button" class="nav-section" :class="{ collapsed: isGroupCollapsed(group.label) }" @click="toggleGroup(group.label)">
            {{ group.label }}<i class="chev">›</i>
          </button>
          <template v-if="!isGroupCollapsed(group.label)">
            <template v-for="item in group.items.filter(item => !['/chat', '/planner'].includes(item.path))" :key="item.path">
              <router-link :to="item.path" custom v-slot="{ navigate }">
                <button :class="{ active: isNavActive(item) }" @click="item.path === '/community/new' ? (communityComposer = true) : navigate(); mobileNav = false">
                  <span class="nav-icon">{{ item.icon }}</span><span class="nav-text">{{ item.name }}</span>
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
          <button class="nav-link" :class="{ active: route.path.startsWith('/settings') }" @click="navigate(); mobileNav = false">
            <span class="nav-icon">⚙</span><span class="nav-text">환경설정</span>
          </button>
        </router-link>
        <!-- 관리자 콘솔은 사용자 화면과 분리된 별도 창으로 연다 -->
        <button class="nav-link" @click="openAdmin('/admin'); mobileNav = false">
          <span class="nav-icon">⌘</span><span class="nav-text">관리자 콘솔</span><small class="nav-ext">↗</small>
        </button>
      </div>
      <div class="account"><i>J</i><span><b>Jisoo Kim</b><small>jisoo@timebar.kr</small></span></div>
    </aside>
    <div v-if="mobileNav" class="scrim" @click="mobileNav = false"></div>
    <main :class="{ 'chat-shell': isChat }">
      <div v-if="isChat" class="chat-mobile-menu"><button aria-label="전체 메뉴 열기" @click="mobileNav = true">☰</button><span>timebar · 대화</span></div>
      <header v-else>
        <button class="hamburger" @click="mobileNav = true">☰</button>
        <div><p class="eyebrow">{{ route.name === '홈' ? todayLabel : 'TIMEBAR WORKSPACE' }}</p><h1>{{ pageTitle }}</h1></div>
        <div class="actions">
          <button class="icon" title="통합 검색" @click="goSearch">⌕</button>
          <button class="icon icon-badge" title="알림" @click="togglePanel('notif')">
            ◔<em v-if="unreadNotifications">{{ unreadNotifications }}</em>
          </button>
          <router-link to="/mentions" custom v-slot="{ navigate }">
            <button class="icon icon-badge" title="멘션함" @click="navigate">
              @<em v-if="hasUnreadMentions || unreadPostMentions" aria-label="안 읽은 멘션 있음">N</em>
            </button>
          </router-link>
          <button class="primary" title="새 글 작성" @click="openComposer">＋ 새 글 작성</button>
        </div>
      </header>
      <p v-if="storageWarning" class="callout" role="alert">{{ storageWarning }}</p>
      <PlannerViewSettings v-if="['/planner/daily', '/planner/weekly', '/planner/monthly', '/planner/yearly'].includes(route.path)" />
      <p v-if="route.path === '/chat'" class="callout">채팅은 이동 가능한 대화 버튼에서 열 수 있어요.</p>
      <router-view v-else />
    </main>
    <GlobalSearchModal v-if="showSearch" @close="showSearch = false" />
    <SidePanel />
    <ProfileModal />
    <PostComposer v-if="composer" />
    <CommunityCreateModal v-if="communityComposer" @close="communityComposer = false" />
  </div>
  <FloatingChat />
</template>
