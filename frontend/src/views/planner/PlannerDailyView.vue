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
// 보기 값은 그대로 두고 화면 글자만 한국어 용어로 보인다(DESIGN.md 7장 용어: Plan=계획, Actual=실제 기록)
const VIEWS = [{ id: '모두', label: '모두' }, { id: 'Plan', label: '계획' }, { id: 'Actual', label: '실제 기록' }]
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
// 계획 블록은 카드 바탕 + 점선 경계 + 중립 글자다(DESIGN.md 4장 Plan and Actual). 카테고리 색으로 채우지 않는다
function planStyle(event) {
  const t = span(event)
  return blockStyle(t.start, t.end)
}
const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const reviewText = ref('')
watch(() => [reviewDate.value, plannerReviews.value.find(item => item.id === reviewDate.value)?.body], ([date]) => { reviewText.value = plannerReviews.value.find(item => item.id === date)?.body || '' }, { immediate: true })
</script>

<template>
  <!-- 기간 이동·보기 전환은 앱이 그리는 PlannerViewSettings 한 줄에 있다. 타임바(계획·실제 비교)가 넓은 주 열, 할 일·회고가 좁은 보조 열이다 -->
  <div class="planner planner-day" :class="{ 'tasks-first': order('tasks') < order('timeline') }">
    <section class="card planner-timebar" :style="{ order: order('timeline') }" aria-labelledby="timebar-title">
      <div class="head">
        <div><h3 id="timebar-title">오늘의 타임바</h3><p>점선은 계획, 실선은 실제 기록이에요</p></div>
        <div class="segmented-tab" role="group" aria-label="타임바에 보일 기록"><button v-for="v in VIEWS" :key="v.id" type="button" :aria-pressed="view === v.id" @click="view = v.id">{{ v.label }}</button></div>
      </div>

      <!-- 빠른 실제 기록: 타임라인 위에 두어 화면을 내리지 않고 시작한다(DESIGN.md 1장 기록 우선) -->
      <form class="record-bar" @submit.prevent="toggleRecord(recordTitle)">
        <label for="actual-record-title" class="record-bar-label">기록할 활동</label>
        <div class="record-bar-row">
          <input id="actual-record-title" v-model="recordTitle" maxlength="200" :disabled="!!recording || recordBusy || !!pending" />
          <button type="submit" class="record" :class="{ 'record-on': recording }" :disabled="recordBusy || !recordLoaded" :aria-busy="recordBusy ? 'true' : undefined">
            {{ recordBusy ? '서버 확인 중…' : pending ? '기록 저장 다시 시도' : recording ? '기록 종료' : '지금부터 기록' }}
          </button>
        </div>
        <p v-if="recording" class="record-status" role="status"><span class="record-dot" aria-hidden="true"></span>{{ recording.title }} · {{ pending?.kind === 'finish' ? '종료 저장 대기' : recording.state === 'PAUSED' ? '일시정지' : '기록 중' }} · <span class="figure">{{ clock(elapsed) }}</span></p>
        <p v-if="recordError" class="input-field-help" data-state="error" role="alert">{{ recordError }}</p>
        <button v-if="recordError" type="button" class="button-text" :disabled="recordBusy" @click="refreshRecords">서버 기록 다시 확인</button>
        <p v-if="saved" class="input-field-help" data-state="success" role="status">저장했어요. <RouterLink :to="{ path: '/planner/daily', query: { date: reviewDate, recording: saved.id } }">{{ saved.title }} 상세 보기</RouterLink></p>
      </form>

      <div class="timeline-tools">
        <div class="segmented-tab planner-range" role="group" aria-label="시간 범위">
          <button type="button" :aria-pressed="!fullDay" @click="fullDay = false">08~23시</button>
          <button type="button" :aria-pressed="fullDay" @click="fullDay = true">24시간</button>
        </div>
        <ul class="timeline-legend" aria-label="범례">
          <li v-if="view !== 'Actual'"><i class="legend-plan" aria-hidden="true"></i>계획</li>
          <li v-if="view !== 'Plan'"><i class="legend-actual" aria-hidden="true"></i>실제 기록</li>
        </ul>
      </div>
      <p v-if="startHour" class="form-note">하루를 <span class="figure">{{ String(startHour).padStart(2, '0') }}:00</span>에 시작해요. 그 전 기록은 전날에 들어가요.</p>
      <p v-if="dayBoundary.state.timeZone && dayBoundary.state.timeZone !== browserZone" class="form-note">계정 시간대(<span class="figure">{{ dayBoundary.state.timeZone }}</span>)와 이 브라우저 시간대(<span class="figure">{{ browserZone }}</span>)가 달라요. 플래너는 이 브라우저 시간대로 그리고, 통계는 계정 시간대로 나눠요.</p>
      <!-- 모두 보기에서는 같은 시간축 위에 계획(왼쪽)과 실제 기록(오른쪽) 두 줄을 나란히 그려 겹치지 않게 비교한다 -->
      <div class="timeline" :class="{ 'full-day': fullDay, 'two-lanes': view === '모두' }">
        <div class="hours" aria-hidden="true"><small v-for="h in hourLabels" :key="h">{{ h }}:00</small></div>
        <div class="grid">
          <div v-for="event in dayEvents" v-show="view !== 'Actual'" :key="event.occurrenceKey" class="plan" :style="planStyle(event)"><span class="sr-only">계획 · </span>{{ event.title }}</div>
          <div v-for="row in dayRecords" :key="row.id" v-show="view !== 'Plan'" class="block" :style="actualStyle(row)"><b>{{ row.title }}</b><small><span class="sr-only">실제 기록 · </span>{{ clock(recordingSeconds(row)) }}</small></div>
        </div>
      </div>

      <div class="actual-list">
        <h4>실제 기록 <span class="figure">{{ dayRecords.length }}</span></h4>
        <p v-if="!recording && !dayRecords.length && recordLoaded" class="empty-state">이 날짜에 저장된 실제 기록이 없어요. 위에서 '지금부터 기록'으로 시작해 보세요.</p>
        <ul v-if="dayRecords.length">
          <li v-for="row in dayRecords" :key="row.id"><RouterLink :to="{ path: '/planner/daily', query: { date: reviewDate, recording: row.id } }" :aria-current="selectedRecord?.id === row.id ? 'true' : undefined"><span>{{ row.title }}</span><span class="figure">{{ clock(recordingSeconds(row)) }}</span></RouterLink></li>
        </ul>
      </div>
      <section v-if="selectedRecord" class="record-detail" aria-label="실제 기록 상세">
        <h3>{{ selectedRecord.title }}</h3>
        <dl>
          <div><dt>시작</dt><dd class="figure">{{ new Date(selectedRecord.startedAt).toLocaleString('ko-KR') }}</dd></div>
          <div v-if="selectedRecord.endedAt"><dt>종료</dt><dd class="figure">{{ new Date(selectedRecord.endedAt).toLocaleString('ko-KR') }} · {{ clock(recordingSeconds(selectedRecord)) }}</dd></div>
          <div><dt>상태</dt><dd>{{ selectedRecord.state === 'COMPLETED' ? '서버 저장 완료' : selectedRecord.state === 'PAUSED' ? '일시정지' : '기록 중' }}</dd></div>
          <div v-if="selectedRecord.pauses?.length"><dt>일시정지</dt><dd>{{ selectedRecord.pauses.length }}번 · 기록 시간에서 뺐어요</dd></div>
        </dl>
        <LinkedRecords kind="actual" :id="selectedRecord.id" :record="selectedRecord" />
      </section>
    </section>

    <section class="card planner-side" :style="{ order: order('tasks') }" aria-labelledby="day-tasks-title">
      <div class="head">
        <div><h3 id="day-tasks-title">오늘의 할 일</h3><p>완료하면 리듬이 기록돼요</p></div>
        <button type="button" class="icon-button" aria-label="할 일 추가" title="할 일 추가" @click="router.push({ path: '/tasks', query: { new: String(Date.now()) } })">+</button>
      </div>
      <label class="task" v-for="task in tasks" :key="task.id"><input type="checkbox" :checked="task.done" :aria-busy="taskStore.isPending(task) ? 'true' : undefined" @click.prevent="taskStore.toggle(task)" /><span><b :class="{ done: task.done }">{{ task.title }}</b><small>{{ task.category }}</small></span></label>
      <p v-if="!tasks.length" class="empty-state">할 일이 없어요. '+'로 추가해 보세요.</p>
      <p v-if="taskStore.notice.message" class="input-field-help" data-state="error" role="status">{{ taskStore.notice.message }}</p>
      <div class="day-review">
        <h3>하루 회고</h3>
        <p>{{ reviewText || content.reviewPrompt }}</p>
        <button type="button" class="button-secondary" @click="openPostComposer('회고', '', { date: reviewDate, body: reviewText })">{{ reviewText ? '회고 수정' : '회고 작성' }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 넓은 열은 타임바, 좁은 열(280~340px)은 할 일·회고. 하루 모드가 할 일을 앞에 두면 열 순서만 바뀐다 */
.planner-day { grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); align-items: start; }
.planner-day.tasks-first { grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); }
.planner-timebar .head { gap: var(--space-lg); flex-wrap: wrap; }
.record-bar { display: grid; gap: var(--space-sm); margin-top: var(--space-xxl); padding: var(--space-xl); border-radius: var(--radius-md); background: var(--color-surface); }
.record-bar-label { font-size: var(--type-body-sm-size); font-weight: 600; }
.record-bar-row { display: flex; gap: var(--space-md); }
.record-bar-row input { flex: 1; min-width: 0; min-height: var(--input-height); padding: 0 var(--input-padding); border: 1px solid var(--color-control-border); font-size: var(--type-body-size); }
.record-bar .record { margin: 0; flex: none; }
.record-status { display: flex; align-items: center; gap: var(--space-sm); margin: 0; color: var(--color-foreground); font-weight: 500; }
.record-dot { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-data); }
.record-bar p { margin: 0; }
.timeline-tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-lg); margin-top: var(--space-xxl); }
.timeline-legend { display: flex; gap: var(--space-xl); margin: 0; padding: 0; list-style: none; font-size: var(--type-caption-size); color: var(--color-body); }
.timeline-legend li { display: flex; align-items: center; gap: var(--space-sm); }
.timeline-legend i { width: 20px; height: 12px; border-radius: var(--radius-xs); background: var(--color-card); }
.legend-plan { border: 1px dashed var(--color-control-border); }
.legend-actual { border: 1px solid var(--color-hairline); border-left: 3px solid var(--color-data); }
/* 기본 보기와 같은 시간당 31px 격자로 24시간을 그린다 */
.timeline.full-day { height: calc(24 * 31px); }
.timeline .hours { width: 48px; }
/* 두 줄 비교: 계획은 왼쪽 절반, 실제 기록은 오른쪽 절반 */
.timeline.two-lanes .grid::after { content: ''; position: absolute; top: 0; bottom: 0; left: 50%; border-left: 1px dashed var(--color-hairline); }
.timeline.two-lanes .plan { right: calc(50% + var(--space-xs)); left: var(--space-sm); }
.timeline.two-lanes .block { left: calc(50% + var(--space-xs)); right: var(--space-sm); }
.actual-list { margin-top: var(--space-xxl); }
.actual-list h4 { margin: 0 0 var(--space-sm); font-size: var(--type-body-sm-size); font-weight: 600; }
.actual-list h4 .figure { color: var(--color-muted); font-weight: 500; }
.actual-list ul { margin: 0; padding: 0; list-style: none; }
.actual-list a { display: flex; justify-content: space-between; gap: var(--space-md); min-height: var(--icon-button-size); align-items: center; padding: 0 var(--space-md); border-bottom: 1px solid var(--color-hairline); color: var(--color-foreground); text-decoration: none; font-size: var(--type-body-sm-size); }
.actual-list a:hover { background: var(--color-surface); }
.actual-list a[aria-current] { background: var(--color-accent-soft); box-shadow: inset 2px 0 0 var(--color-accent); font-weight: 600; }
.actual-list .empty-state { padding: var(--space-md) 0; }
.record-detail { margin-top: var(--space-xl); padding-top: var(--space-xl); border-top: 1px solid var(--color-hairline); }
.record-detail dl { display: grid; gap: var(--space-sm); margin: var(--space-md) 0; }
.record-detail dl > div { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: var(--space-md); font-size: var(--type-body-sm-size); }
.record-detail dt { color: var(--color-muted); }
.record-detail dd { margin: 0; }
.planner-side .head { align-items: center; }
.day-review { display: grid; gap: var(--space-sm); justify-items: start; margin-top: var(--space-xxl); padding-top: var(--space-xl); border-top: 1px solid var(--color-hairline); }
.day-review h3 { font-size: var(--type-body-size); }
.day-review p { margin: 0; }
@media (max-width: 1150px) { .planner-day, .planner-day.tasks-first { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 600px) { .record-bar { padding: var(--space-lg); } .record-bar-row { flex-direction: column; } .record-bar .record { width: 100%; } }
</style>
