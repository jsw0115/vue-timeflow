<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SCREENS, domainLabel } from '../data/screens'

import PatternListDetail from '../components/patterns/PatternListDetail.vue'
import PatternForm from '../components/patterns/PatternForm.vue'
import PatternModal from '../components/patterns/PatternModal.vue'
import PatternDrawer from '../components/patterns/PatternDrawer.vue'
import PatternChat from '../components/patterns/PatternChat.vue'
import PatternKanban from '../components/patterns/PatternKanban.vue'
import PatternHeatmapCalendar from '../components/patterns/PatternHeatmapCalendar.vue'
import PatternAdminTable from '../components/patterns/PatternAdminTable.vue'
import PatternDashboard from '../components/patterns/PatternDashboard.vue'
import PatternEditor from '../components/patterns/PatternEditor.vue'
import PatternFocus from '../components/patterns/PatternFocus.vue'
import PatternTimetable from '../components/patterns/PatternTimetable.vue'

const PATTERNS = {
  'list-detail': PatternListDetail,
  form: PatternForm,
  modal: PatternModal,
  drawer: PatternDrawer,
  chat: PatternChat,
  kanban: PatternKanban,
  heatmap: PatternHeatmapCalendar,
  'admin-table': PatternAdminTable,
  dashboard: PatternDashboard,
  editor: PatternEditor,
  focus: PatternFocus,
  timetable: PatternTimetable,
}

const route = useRoute()
const screen = computed(() => SCREENS.find((s) => s.id === route.params.id))
const patternComp = computed(() => (screen.value ? PATTERNS[screen.value.pattern] : null))
const related = computed(() =>
  screen.value ? SCREENS.filter((s) => s.domain === screen.value.domain && s.id !== screen.value.id) : []
)
</script>

<template>
  <template v-if="screen">
    <div class="crumbs">
      <router-link to="/sitemap">전체 화면</router-link>
      <span>›</span>
      <router-link :to="`/sitemap`">{{ domainLabel(screen.domain) }}</router-link>
      <span>›</span>
      <span>{{ screen.name }}</span>
    </div>
    <div class="screen-head">
      <div>
        <p class="eyebrow">{{ screen.id }} · {{ domainLabel(screen.domain) }}</p>
        <h1 style="font-size:22px">{{ screen.name }}</h1>
        <p>{{ screen.role }}</p>
      </div>
      <div class="sc-tags">
        <span class="phase-badge" :class="'p' + screen.phase">Phase {{ screen.phase }}</span>
        <span class="tag">{{ screen.type }}</span>
        <span class="tag">{{ screen.pattern }} 패턴</span>
      </div>
    </div>

    <component :is="patternComp" :screen="screen" />

    <section class="related-nav" v-if="related.length">
      <h3>{{ domainLabel(screen.domain) }} 도메인의 다른 화면</h3>
      <div class="screen-grid">
        <router-link class="screen-card" v-for="s in related" :key="s.id" :to="s.existingPath ?? `/screens/${s.id}`">
          <div class="sc-top"><span class="sc-id">{{ s.id }}</span></div>
          <b>{{ s.name }}</b>
          <p>{{ s.role }}</p>
        </router-link>
      </div>
    </section>
  </template>
  <p v-else>존재하지 않는 화면 ID입니다.</p>
</template>
