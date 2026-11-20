<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasks, events, taskStore, openPostComposer } from '../../store/appState'
import { eventOccurrences } from '../../utils/recurrence.mjs'
import { modeState, modeContent } from '../../store/modeProfiles'
import { dayLabel, cursor, shift, goToday } from '../../store/plannerDate'
import { plannerReviews } from '../../store/plannerReviews'
import { localDate } from '../../utils/postValidation.mjs'
import { useRecording } from '../../features/recording/useRecording.js'
import { recordingSeconds } from '../../features/recording/recordingClient.mjs'
import LinkedRecords from '../../components/LinkedRecords.vue'
import { dayBoundary, dayRange } from '../../features/records/dayBoundary.mjs'

const router = useRouter()
const route = useRoute()
watch(() => route.query.date, value => { if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(+new Date(value + 'T12:00:00'))) cursor.value = new Date(value + 'T12:00:00') }, { immediate: true })
const view = ref('모두')
const content = computed(() => modeContent(modeState.activeMode).planner)
function order(key) {
  return content.value.cardOrder[key]
}

const recordTitle = ref('실제 기록')
const { active: recording, records, pending, error: recordError, busy: recordBusy, loaded: recordLoaded, saved, elapsed, refresh: refreshRecords, toggle: toggleRecord } = useRecording()
function clock(sec) {
  return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0')
}

/* 회고 — 저장하면 날짜별로 보관된다 */
const reviewDate = computed(() => localDate(cursor.value))
// 하루는 계정의 하루 시작 시각부터 다음 날 같은 시각 직전까지다(UF-95). 로그아웃 상태는 자정 기준
const startHour = computed(() => dayBoundary.state.startHour)
const day = computed(() => dayRange(reviewDate.value, startHour.value))
// 24시간 보기(UF-94)는 그 하루 전체를, 기본 보기는 08~23시를 그린다. 고른 보기는 이 브라우저에 남긴다
const FULL_DAY_KEY = 'timebar.planner.fullDay.v1'
const fullDay = ref((() => { try { return localStorage.getItem(FULL_DAY_KEY) === '1' } catch { return false } })())
watch(fullDay, (value) => { try { localStorage.setItem(FULL_DAY_KEY, value ? '1' : '0') } catch { /* 저장하지 못해도 이번 화면에는 적용된다 */ } })
const viewRange = computed(() => (fullDay.value ? day.value : { start: +new Date(reviewDate.value + 'T08:00:00'), end: +new Date(reviewDate.value + 'T23:00:00') }))
const hourLabels = computed(() => (fullDay.value
  ? Array.from({ length: 24 }, (_, i) => String((startHour.value + i) % 24).padStart(2, '0'))
  : ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22']))
const nextDate = computed(() => { const d = new Date(reviewDate.value + 'T12:00:00'); d.setDate(d.getDate() + 1); return localDate(d) })
const span = (event) => ({ start: +new Date(event.startDate + 'T' + event.startTime + ':00'), end: +new Date(event.endDate + 'T' + event.endTime + ':00') })
// 하루 시작이 0시가 아니면 다음 날 새벽 회차도 이 날에 들어온다
const dayEvents = computed(() => eventOccurrences(events.value, reviewDate.value, nextDate.value).filter((event) => { const t = span(event); return t.start < day.value.end && t.end > day.value.start }))
// 자정을 넘는 기록은 두 날짜에 모두 보이고 원본 ID는 하나다(UF-94)
const dayRecords = computed(() => records.value.filter(row => row.state === 'COMPLETED' && Date.parse(row.startedAt) < day.value.end && Date.parse(row.endedAt) > day.value.start))
const selectedRecord = computed(() => records.value.find(row => row.id === route.query.recording))
function blockStyle(from, to) {
  const { start: begin, end } = viewRange.value
  const start = Math.max(begin, from), finish = Math.min(end, to)
  return { display: finish <= start ? 'none' : undefined, top: Math.max(0, (start - begin) / (end - begin) * 100) + '%', height: Math.max(2, (finish - start) / (end - begin) * 100) + '%' }
}
const actualStyle = (row) => blockStyle(Date.parse(row.startedAt), Date.parse(row.endedAt))
function planStyle(event) {
  const t = span(event)
  return { ...blockStyle(t.start, t.end), background: event.color }
}
const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const reviewText = ref('')
watch(() => [reviewDate.value, plannerReviews.value.find(item => item.id === reviewDate.value)?.body], ([date]) => { reviewText.value = plannerReviews.value.find(item => item.id === date)?.body || '' }, { immediate: true })
</script>

<template>
  <div class="toolbar">
    <button aria-label="이전 날" @click="shift('day', -1)">‹</button>
    <b>▣ {{ dayLabel }}</b>
    <button aria-label="다음 날" @click="shift('day', 1)">›</button>
    <button class="review" style="margin: 0; padding: 5px 10px" @click="goToday">오늘</button>
    <span></span>
  </div>
  <div class="planner">
    <section class="card" :style="{ order: order('timeline') }">
      <div class="head">
        <div><h3>오늘의 타임바</h3><p>계획과 실제를 색으로 기록해요</p></div>
        <div class="tabs"><button v-for="v in ['Actual', 'Plan', '모두']" :key="v" :class="{ selected: view === v }" @click="view = v">{{ v }}</button></div>
      </div>
      <div class="segmented-tab planner-range" role="group" aria-label="시간 범위">
        <button type="button" :aria-pressed="!fullDay" @click="fullDay = false">08~23시</button>
        <button type="button" :aria-pressed="fullDay" @click="fullDay = true">24시간</button>
      </div>
      <p v-if="startHour" class="form-note">하루를 <span class="figure">{{ String(startHour).padStart(2, '0') }}:00</span>에 시작해요. 그 전 기록은 전날에 들어가요.</p>
      <p v-if="dayBoundary.state.timeZone && dayBoundary.state.timeZone !== browserZone" class="form-note">계정 시간대(<span class="figure">{{ dayBoundary.state.timeZone }}</span>)와 이 브라우저 시간대(<span class="figure">{{ browserZone }}</span>)가 달라요. 플래너는 이 브라우저 시간대로 그리고, 통계는 계정 시간대로 나눠요.</p>
      <div class="timeline" :class="{ 'full-day': fullDay }">
        <div class="hours"><small v-for="h in hourLabels" :key="h">{{ h }}:00</small></div>
        <div class="grid">
          <div v-for="event in dayEvents" v-show="view !== 'Actual'" :key="event.occurrenceKey" class="plan" :style="planStyle(event)">계획 · {{ event.title }}</div>
          <div v-for="row in dayRecords" :key="row.id" v-show="view !== 'Plan'" class="block" :style="actualStyle(row)"><b>{{ row.title }}</b><small>실제 기록 · {{ clock(recordingSeconds(row)) }}</small></div>
        </div>
      </div>
      <label for="actual-record-title">기록할 활동</label>
      <input id="actual-record-title" v-model="recordTitle" maxlength="200" :disabled="!!recording || recordBusy || !!pending" />
      <p v-if="recording" role="status">{{ recording.title }} · {{ pending?.kind === 'finish' ? '종료 저장 대기' : recording.state === 'PAUSED' ? '일시정지' : '기록 중' }} · {{ clock(elapsed) }}</p>
      <button class="record" :class="{ 'record-on': recording }" :disabled="recordBusy || !recordLoaded" @click="toggleRecord(recordTitle)">
        {{ recordBusy ? '서버 확인 중…' : pending ? '기록 저장 다시 시도' : recording ? '기록 종료' : '지금부터 기록' }}
      </button>
      <p v-if="recordError" role="alert">{{ recordError }}</p>
      <button v-if="recordError" type="button" class="review" :disabled="recordBusy" @click="refreshRecords">서버 기록 다시 확인</button>
      <p v-if="saved" role="status">저장했습니다. <RouterLink :to="{ path: '/planner/daily', query: { date: reviewDate, recording: saved.id } }">{{ saved.title }} 상세 보기</RouterLink></p>
      <p v-if="!recording && !dayRecords.length && recordLoaded">이 날짜에 저장된 실제 기록이 없습니다.</p>
      <ul v-if="dayRecords.length">
        <li v-for="row in dayRecords" :key="row.id"><RouterLink :to="{ path: '/planner/daily', query: { date: reviewDate, recording: row.id } }">{{ row.title }} · {{ clock(recordingSeconds(row)) }}</RouterLink></li>
      </ul>
      <section v-if="selectedRecord" class="review" aria-label="실제 기록 상세">
        <h3>{{ selectedRecord.title }}</h3>
        <p>시작 {{ new Date(selectedRecord.startedAt).toLocaleString('ko-KR') }}</p>
        <p v-if="selectedRecord.endedAt">종료 {{ new Date(selectedRecord.endedAt).toLocaleString('ko-KR') }} · {{ clock(recordingSeconds(selectedRecord)) }}</p>
        <p>상태 {{ selectedRecord.state === 'COMPLETED' ? '서버 저장 완료' : selectedRecord.state === 'PAUSED' ? '일시정지' : '기록 중' }}</p>
        <p v-if="selectedRecord.pauses?.length">일시정지 {{ selectedRecord.pauses.length }}번 · 기록 시간에서 뺐어요</p>
        <LinkedRecords kind="actual" :id="selectedRecord.id" :record="selectedRecord" />
      </section>
    </section>
    <section class="card" :style="{ order: order('tasks') }">
      <div class="head">
        <div><h3>오늘의 할 일</h3><p>완료하면 리듬이 기록돼요</p></div>
        <button @click="router.push({ path: '/tasks', query: { new: String(Date.now()) } })">＋</button>
      </div>
      <label class="task" v-for="task in tasks" :key="task.id"><input type="checkbox" :checked="task.done" :aria-busy="taskStore.isPending(task) ? 'true' : undefined" @click.prevent="taskStore.toggle(task)" /><span><b :class="{ done: task.done }">{{ task.title }}</b><small>{{ task.category }}</small></span></label>
      <p v-if="taskStore.notice.message" class="input-field-help" data-state="error" role="status">{{ taskStore.notice.message }}</p>
      <div class="review">
        <span class="pill">DAILY REVIEW</span>
        <h3>오늘을 짧게 돌아볼까요?</h3>
        <p>{{ reviewText || content.reviewPrompt }}</p>
        <button @click="openPostComposer('회고', '', { date: reviewDate, body: reviewText })">{{ reviewText ? '회고 수정' : '회고 작성' }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.planner-range { margin-top: var(--space-lg); width: fit-content; }
/* 기본 보기와 같은 시간당 31px 격자로 24시간을 그린다 */
.timeline.full-day { height: calc(24 * 31px); }
</style>
