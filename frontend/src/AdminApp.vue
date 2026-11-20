<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminGroups } from './router'
import { session } from './features/auth/session.js'
import { adminAccess, refreshAdminAccess } from './features/admin/admin.js'
import { ADMIN_ACCESS_TEXT } from './features/admin/adminClient.mjs'

/**
 * 관리자 전용 셸 — 사용자 화면과 완전히 분리된 레이아웃이다.
 * 구조(LNB + 헤더 + 콘텐츠)는 사용자 화면과 같게 두되, 사용자 메뉴는 절대 섞이지 않는다.
 */
const route = useRoute()
const router = useRouter()
const mobileNav = ref(false)

const pageTitle = computed(() => route.meta?.title ?? '')
const collapsed = ref({})
function toggleGroup(label) {
  collapsed.value[label] = !collapsed.value[label]
}

// 권한은 서버가 정한다. 관리자 지표 API가 403이면 화면과 메뉴를 보이지 않고 안내만 둔다(PR-10 5단계, UF-117·UT-199)
watch(() => session.userId, (id) => refreshAdminAccess(Boolean(id)), { immediate: true })
const allowed = computed(() => adminAccess.state === 'allowed')
// 서버에 연결한 관리 화면. 나머지는 아직 시연 데이터라 화면 위에 알린다
const SERVER_PATHS = new Set(['/admin', '/admin/stats'])
const demo = computed(() => route.path.startsWith('/admin') && !SERVER_PATHS.has(route.path))
const accountName = computed(() => session.nickname || session.email || '관리자')

function backToApp() {
  // 사용자 화면은 별도 창이므로, 이 창에서 나갈 때는 홈으로 보낸다
  router.push('/')
}
</script>

<template>
  <div class="app admin-shell">
    <aside class="sidebar" :class="{ open: mobileNav }">
      <div class="brand"><b>a</b>timebar <small class="admin-chip">ADMIN</small></div>
      <button class="workspace" @click="backToApp">
        <i>↩</i><span><b>사용자 화면으로</b><small>관리자 창 닫기</small></span>
      </button>
      <nav v-if="allowed">
        <template v-for="group in adminGroups" :key="group.label">
          <button type="button" class="nav-section" :class="{ collapsed: collapsed[group.label] }" @click="toggleGroup(group.label)">
            {{ group.label }}<i class="chev">›</i>
          </button>
          <template v-if="!collapsed[group.label]">
            <router-link v-for="item in group.items" :key="item.path" :to="item.path" custom v-slot="{ navigate }">
              <button :class="{ active: route.path === item.path }" @click="navigate(); mobileNav = false">
                <span class="nav-icon">{{ item.icon }}</span><span class="nav-text">{{ item.name }}</span>
              </button>
            </router-link>
          </template>
        </template>
      </nav>
      <div v-if="allowed" class="account"><i>{{ accountName.slice(0, 1) }}</i><span><b>{{ accountName }}</b><small>관리자</small></span></div>
    </aside>

    <div v-if="mobileNav" class="scrim" @click="mobileNav = false"></div>

    <main>
      <header>
        <button class="hamburger" @click="mobileNav = true">☰</button>
        <div><p class="eyebrow">TIMEBAR ADMIN CONSOLE</p><h1>{{ allowed ? pageTitle : '관리자 화면' }}</h1></div>
        <div v-if="allowed" class="actions">
          <button class="review" style="margin: 0" @click="router.push('/admin/audit')">감사 로그</button>
        </div>
      </header>
      <template v-if="allowed">
        <p v-if="demo" class="input-field-help admin-demo-note" role="note">이 화면은 아직 시연 데이터예요. 바꾼 내용은 서버에 저장되지 않아요.</p>
        <router-view />
      </template>
      <p v-else-if="adminAccess.state === 'checking'" class="input-field-help" role="status">관리자 권한을 확인하는 중이에요.</p>
      <section v-else class="card">
        <div class="empty-state" role="alert"><p>{{ ADMIN_ACCESS_TEXT[adminAccess.state] ?? ADMIN_ACCESS_TEXT.error }}</p>
          <button v-if="adminAccess.state === 'signedOut'" type="button" class="button-secondary" @click="router.push('/auth/login')">로그인하기</button>
          <button v-else-if="adminAccess.state === 'error'" type="button" class="button-secondary" @click="refreshAdminAccess(Boolean(session.userId))">다시 시도</button>
          <button v-else type="button" class="button-secondary" @click="backToApp">사용자 화면으로</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-demo-note { margin: 0 0 var(--space-lg); }
</style>
