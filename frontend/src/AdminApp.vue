<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminGroups } from './router'
import { auditLogs } from './store/adminOps'

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
const todayActions = computed(() => auditLogs.value.filter((l) => l.at.startsWith(new Date().toISOString().slice(0, 10))).length)

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
      <nav>
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
      <div class="account"><i>A</i><span><b>운영자A</b><small>최고 관리자</small></span></div>
    </aside>

    <div v-if="mobileNav" class="scrim" @click="mobileNav = false"></div>

    <main>
      <header>
        <button class="hamburger" @click="mobileNav = true">☰</button>
        <div><p class="eyebrow">TIMEBAR ADMIN CONSOLE</p><h1>{{ pageTitle }}</h1></div>
        <div class="actions">
          <span class="badge">오늘 조치 {{ todayActions }}건</span>
          <button class="review" style="margin: 0" @click="router.push('/admin/audit')">감사 로그</button>
        </div>
      </header>
      <router-view />
    </main>
  </div>
</template>
