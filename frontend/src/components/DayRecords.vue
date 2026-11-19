<!-- 한 날짜의 일정 회차와 실제 기록을 이동 링크로 보인다. 다이어리에서 그날 한 일을 오갈 때 쓴다(PR-08 UF-92). -->
<script setup>
import { computed, ref, watch } from 'vue'
import { session } from '../features/auth/session.js'
import { apiRequest } from '../features/auth/apiRequest.js'
import { events } from '../store/appState'
import { eventOccurrences } from '../utils/recurrence.mjs'

const props = defineProps({ date: { type: String, required: true } })
const recordings = ref({ status: 'idle', items: [] })
let generation = 0
async function load() {
  const expected = ++generation
  if (!session.userId) { recordings.value = { status: 'idle', items: [] }; return }
  recordings.value = { status: 'loading', items: recordings.value.items }
  try {
    const items = await apiRequest('/api/planner/recordings')
    if (expected === generation) recordings.value = { status: 'ready', items }
  } catch {
    if (expected === generation) recordings.value = { status: 'error', items: [] }
  }
}
watch(() => session.userId, load, { immediate: true })

const schedules = computed(() => (/^\d{4}-\d{2}-\d{2}$/.test(props.date) ? eventOccurrences(events.value, props.date, props.date) : []))
// 이 브라우저 시간대의 그날 0시~다음 날 0시와 겹치는 완료 기록. 자정을 넘는 기록은 두 날짜에 모두 보인다
const actuals = computed(() => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(props.date)) return []
  const begin = new Date(props.date + 'T00:00:00'), end = new Date(begin)
  end.setDate(end.getDate() + 1)
  return recordings.value.items.filter((row) => row.state === 'COMPLETED' && Date.parse(row.startedAt) < +end && Date.parse(row.endedAt) > +begin)
})
const clock = (iso) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
</script>

<template>
  <section class="day-records" aria-label="이 날의 일정과 실제 기록">
    <div class="section-label">이 날의 일정과 실제 기록</div>
    <ul v-if="schedules.length || actuals.length">
      <li v-for="o in schedules" :key="o.occurrenceKey">일정 · <span class="figure">{{ o.startTime }}</span> <RouterLink :to="{ path: '/events', query: { id: o.sourceId ?? o.id, occurrence: o.startDate } }">{{ o.title }}</RouterLink></li>
      <li v-for="row in actuals" :key="row.id">실제 기록 · <span class="figure">{{ clock(row.startedAt) }}</span> <RouterLink :to="{ path: '/planner/daily', query: { date, recording: row.id } }">{{ row.title }}</RouterLink></li>
    </ul>
    <p v-else-if="recordings.status !== 'loading'" class="empty-state">이 날 남긴 일정과 실제 기록이 아직 없어요. 일정을 만들거나 플래너에서 기록을 남기면 여기에 보여요.</p>
    <p v-if="recordings.status === 'loading'" class="input-field-help" role="status">실제 기록을 불러오는 중이에요.</p>
    <div v-else-if="recordings.status === 'error'" role="status">
      <p class="input-field-help" data-state="error">실제 기록을 불러오지 못했어요.</p>
      <button type="button" class="button-secondary" @click="load">다시 불러오기</button>
    </div>
    <p v-else-if="!session.userId" class="input-field-help">실제 기록은 로그인하면 함께 보여요.</p>
  </section>
</template>

<style scoped>
.day-records { margin-top: var(--space-xxl); }
.day-records ul { margin: var(--space-sm) 0 0; padding-left: var(--space-xl); }
.day-records li { margin: var(--space-xs) 0; }
</style>
