<!-- 한 날짜의 일정 회차와 실제 기록을 이동 링크로 보인다. 다이어리에서 그날 한 일을 오갈 때 쓴다(PR-08 UF-92). -->
<script setup>
import { tr } from '../store/locale'
import { computed, ref, watch } from 'vue'
import { session } from '../features/auth/session.js'
import { apiRequest } from '../features/auth/apiRequest.js'
import { events } from '../store/appState'
import { eventOccurrences } from '../utils/recurrence.mjs'
import { localDate } from '../utils/postValidation.mjs'
import { dayBoundary, dayRange } from '../features/records/dayBoundary.mjs'

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

// 플래너와 같은 하루(계정의 하루 시작 시각부터 다음 날 같은 시각 직전, 이 브라우저 시간대)를 쓴다(UF-95)
const valid = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(props.date))
const day = computed(() => dayRange(props.date, dayBoundary.state.startHour))
const schedules = computed(() => {
  if (!valid.value) return []
  const next = new Date(props.date + 'T12:00:00'); next.setDate(next.getDate() + 1)
  return eventOccurrences(events.value, props.date, localDate(next)).filter((o) => {
    const start = +new Date(o.startDate + 'T' + o.startTime + ':00'), end = +new Date(o.endDate + 'T' + o.endTime + ':00')
    return start < day.value.end && end > day.value.start
  })
})
// 자정을 넘는 기록은 두 날짜에 모두 보인다
const actuals = computed(() => (valid.value ? recordings.value.items.filter((row) => row.state === 'COMPLETED' && Date.parse(row.startedAt) < day.value.end && Date.parse(row.endedAt) > day.value.start) : []))
const clock = (iso) => new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
</script>

<template>
  <section class="day-records" :aria-label="tr('이 날의 일정과 실제 기록')">
    <div class="section-label">{{ tr('이 날의 일정과 실제 기록') }}</div>
    <ul v-if="schedules.length || actuals.length">
      <li v-for="o in schedules" :key="o.occurrenceKey">{{ tr('일정 ·') }} <span class="figure">{{ o.startTime }}</span> <RouterLink :to="{ path: '/events', query: { id: o.sourceId ?? o.id, occurrence: o.startDate } }">{{ o.title }}</RouterLink></li>
      <li v-for="row in actuals" :key="row.id">{{ tr('실제 기록 ·') }} <span class="figure">{{ clock(row.startedAt) }}</span> <RouterLink :to="{ path: '/planner/daily', query: { date, recording: row.id } }">{{ row.title }}</RouterLink></li>
    </ul>
    <p v-else-if="recordings.status !== 'loading'" class="empty-state">{{ tr('이 날 남긴 일정과 실제 기록이 아직 없어요. 일정을 만들거나 플래너에서 기록을 남기면 여기에 보여요.') }}</p>
    <p v-if="recordings.status === 'loading'" class="input-field-help" role="status">{{ tr('실제 기록을 불러오는 중이에요.') }}</p>
    <div v-else-if="recordings.status === 'error'" role="status">
      <p class="input-field-help" data-state="error">{{ tr('실제 기록을 불러오지 못했어요.') }}</p>
      <button type="button" class="button-secondary" @click="load">{{ tr('다시 불러오기') }}</button>
    </div>
    <p v-else-if="!session.userId" class="input-field-help">{{ tr('실제 기록은 로그인하면 함께 보여요.') }}</p>
  </section>
</template>

<style scoped>
.day-records { margin-top: var(--space-xxl); }
.day-records ul { margin: var(--space-sm) 0 0; padding-left: var(--space-xl); }
.day-records li { margin: var(--space-xs) 0; }
</style>
