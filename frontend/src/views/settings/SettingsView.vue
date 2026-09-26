<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from '../../router/settingsSections'

/**
 * 환경설정 셸 — 관리자 콘솔과 같은 구조.
 * 좌측에서 구역을 고르면 우측 데이터 영역만 그 구역 내용으로 바뀐다(페이지 전체 이동 없음).
 * 주소는 /settings/<id>로 유지해 새로고침·북마크·뒤로가기가 그대로 동작한다.
 */
const route = useRoute()
const router = useRouter()

const DEFAULT_ID = SETTINGS_SECTIONS[0].id
function idFromRoute() {
  const id = route.params.section
  return SETTINGS_SECTIONS.some((s) => s.id === id) ? id : DEFAULT_ID
}
const activeId = ref(idFromRoute())
watch(() => route.params.section, () => (activeId.value = idFromRoute()))

const active = computed(() => SETTINGS_SECTIONS.find((s) => s.id === activeId.value) ?? SETTINGS_SECTIONS[0])

function select(section) {
  if (activeId.value === section.id) return
  activeId.value = section.id
  // 주소만 바꾸고 셸은 그대로 두어 우측 영역만 교체된다
  router.push({ path: '/settings/' + section.id })
}

const query = ref('')
const filteredGroups = computed(() => {
  const k = query.value.trim()
  if (!k) return SETTINGS_GROUPS
  return SETTINGS_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.label.includes(k) || (i.desc ?? '').includes(k)),
  })).filter((g) => g.items.length)
})
const noResult = computed(() => query.value.trim() && !filteredGroups.value.length)
</script>

<template>
  <div class="settings">
    <nav class="setting-menu card">
      <label class="list-search setting-menu-search">
        <span aria-hidden="true">⌕</span>
        <input v-model="query" type="search" placeholder="설정 검색" />
        <button v-if="query" class="person-info" type="button" title="지우기" aria-label="지우기" @click="query = ''">×</button>
      </label>

      <template v-for="g in filteredGroups" :key="g.label">
        <div class="setting-menu-group">{{ g.label }}</div>
        <button
          v-for="item in g.items"
          :key="item.id"
          :class="{ active: activeId === item.id }"
          :aria-current="activeId === item.id ? 'true' : undefined"
          @click="select(item)"
        >
          <i class="setting-menu-icon">{{ item.icon }}</i>
          <span class="setting-menu-label">{{ item.label }}</span>
          <span class="setting-menu-caret">›</span>
        </button>
      </template>

      <p v-if="noResult" class="form-note" style="padding: 12px">검색 결과가 없어요.</p>
    </nav>

    <div class="setting-pane">
      <component :is="active.component" />
    </div>
  </div>
</template>
