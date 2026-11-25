<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SETTINGS_GROUPS, SETTINGS_SECTIONS } from '../../router/settingsSections'
import AppIcon from '../../components/icons/AppIcon.vue'
import { SETTINGS_ICONS } from '../../components/icons/iconPaths.mjs'
import { localeState } from '../../store/locale'
import { settingDesc, settingLabel, settingsGroupLabel, shellText } from '../../features/i18n/locale.mjs'

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
const locale = computed(() => localeState.locale)
const t = (key) => shellText(key, locale.value)
const filteredGroups = computed(() => {
  const k = query.value.trim()
  if (!k) return SETTINGS_GROUPS
  return SETTINGS_GROUPS.map((g) => ({
    ...g,
    // 보이는 언어의 이름·설명과 한국어 원문 둘 다로 찾는다(PR-32)
    items: g.items.filter((i) => [i.label, i.desc ?? '', settingLabel(i, locale.value), settingDesc(i, locale.value)].some((text) => text.toLowerCase().includes(k.toLowerCase()))),
  })).filter((g) => g.items.length)
})
const noResult = computed(() => query.value.trim() && !filteredGroups.value.length)
</script>

<template>
  <div class="settings">
    <nav class="setting-menu card" :lang="locale">
      <label class="list-search setting-menu-search">
        <span aria-hidden="true">⌕</span>
        <input v-model="query" type="search" :placeholder="t('searchSettings')" :aria-label="t('searchSettings')" />
        <button v-if="query" class="person-info" type="button" :title="t('clear')" :aria-label="t('clear')" @click="query = ''">×</button>
      </label>

      <template v-for="g in filteredGroups" :key="g.label">
        <div class="setting-menu-group">{{ settingsGroupLabel(g.label, locale) }}</div>
        <button
          v-for="item in g.items"
          :key="item.id"
          :class="{ active: activeId === item.id }"
          :aria-current="activeId === item.id ? 'true' : undefined"
          @click="select(item)"
        >
          <i class="setting-menu-icon"><AppIcon :name="SETTINGS_ICONS[item.id]" :fallback="item.icon" :size="18" /></i>
          <span class="setting-menu-label">{{ settingLabel(item, locale) }}</span>
          <span class="setting-menu-caret" aria-hidden="true"><AppIcon name="chevronRight" :size="16" /></span>
        </button>
      </template>

      <p v-if="noResult" class="empty-state" role="status">{{ t('noSettingResult') }}</p>
    </nav>

    <div class="setting-pane">
      <component :is="active.component" />
    </div>
  </div>
</template>

<style scoped>
/* 목록 버튼 규칙(.setting-menu button: 폭 100%·여백)이 검색칸의 지우기 버튼에도 걸려 입력칸이 0px로 줄었다. 지우기 버튼만 작은 크기로 되돌린다 */
.setting-menu-search button { flex: none; width: 24px; height: 24px; padding: 0; border-bottom: 0; justify-content: center; align-items: center; }
</style>
