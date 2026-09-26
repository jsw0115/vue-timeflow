<script setup>
import { ref, computed } from 'vue'
import { DOMAINS, SCREENS } from '../data/screens'

const search = ref('')
const phase = ref(0)

const phaseTabs = [
  { v: 0, label: '전체' },
  { v: 1, label: 'Phase 1' },
  { v: 2, label: 'Phase 2' },
  { v: 3, label: 'Phase 3' },
  { v: 4, label: 'Phase 4' },
  { v: 5, label: 'Phase 5' },
]

const filtered = computed(() =>
  SCREENS.filter((s) => {
    if (phase.value && s.phase !== phase.value) return false
    if (!search.value) return true
    const q = search.value.toLowerCase()
    return s.id.toLowerCase().includes(q) || s.name.includes(search.value) || s.role.includes(search.value)
  })
)

const groups = computed(() =>
  DOMAINS.map((d) => ({ ...d, screens: filtered.value.filter((s) => s.domain === d.id) })).filter((g) => g.screens.length)
)

function linkOf(s) {
  return s.existingPath ?? `/screens/${s.id}`
}
</script>

<template>
  <div class="sitemap-tools">
    <div class="filter"><button v-for="t in phaseTabs" :key="t.v" :class="{ selected: phase === t.v }" @click="phase = t.v">{{ t.label }}</button></div>
    <input v-model="search" placeholder="화면 ID, 이름, 기능으로 검색 (예: PLAN, 캘린더, 채팅)" />
  </div>
  <p style="margin-bottom:18px">design-implementation-plan.md 기준 22개 기능 도메인 · 총 {{ SCREENS.length }}개 화면 중 {{ filtered.length }}개 표시 · 9개는 이미 만들어진 화면으로 바로 연결됩니다.</p>

  <section class="domain-group card" v-for="g in groups" :key="g.id">
    <div class="domain-group-head">
      <h3>{{ g.label }}</h3>
      <span class="phase-badge" :class="'p' + g.phase">Phase {{ g.phase }}</span>
      <small>{{ g.screens.length }}개 화면</small>
    </div>
    <div class="screen-grid">
      <router-link class="screen-card" v-for="s in g.screens" :key="s.id" :to="linkOf(s)">
        <div class="sc-top">
          <span class="sc-id">{{ s.id }}</span>
          <span class="phase-badge" :class="'p' + s.phase">P{{ s.phase }}</span>
        </div>
        <b>{{ s.name }}</b>
        <p>{{ s.role }}</p>
        <div class="sc-tags">
          <span class="tag">{{ s.type }}</span>
          <span class="tag">{{ s.existingPath ? '구현됨' : s.pattern }}</span>
        </div>
      </router-link>
    </div>
  </section>
</template>
