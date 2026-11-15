<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasks, events, toggle, openPostComposer } from '../../store/appState'
import { eventOccurrences } from '../../utils/recurrence.mjs'
import { modeState, modeContent } from '../../store/modeProfiles'
import { dayLabel, cursor, shift, goToday } from '../../store/plannerDate'
import { plannerReviews } from '../../store/plannerReviews'
import { localDate } from '../../utils/postValidation.mjs'
import { useRecording } from '../../features/recording/useRecording.js'
import { recordingSeconds } from '../../features/recording/recordingClient.mjs'

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
const dayEvents = computed(() => eventOccurrences(events.value, reviewDate.value, reviewDate.value))
const dayRecords = computed(() => {
  const begin = new Date(reviewDate.value + 'T00:00:00'), end = new Date(begin)
  end.setDate(end.getDate() + 1)
  return records.value.filter(row => row.state === 'COMPLETED' && Date.parse(row.startedAt) < +end && Date.parse(row.endedAt) >= +begin)
})
const selectedRecord = computed(() => records.value.find(row => row.id === route.query.recording))
function actualStyle(row) {
  const begin = +new Date(reviewDate.value + 'T08:00:00'), end = +new Date(reviewDate.value + 'T23:00:00')
  const start = Math.max(begin, Date.parse(row.startedAt)), finish = Math.min(end, Date.parse(row.endedAt))
  return { display: finish < start ? 'none' : undefined, top: Math.max(0, (start - begin) / (end - begin) * 100) + '%', height: Math.max(2, (finish - start) / (end - begin) * 100) + '%' }
}
function planStyle(event) {
  const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
  const start = event.startDate < reviewDate.value ? 480 : Math.max(480, minutes(event.startTime)), end = event.endDate > reviewDate.value ? 1380 : Math.min(1380, minutes(event.endTime))
  return { top: Math.max(0, (start - 480) / 900 * 100) + '%', height: Math.max(2, (end - start) / 900 * 100) + '%', background: event.color }
}
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
      <div class="timeline">
        <div class="hours"><small v-for="h in ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22']" :key="h">{{ h }}:00</small></div>
        <div class="grid">
          <div v-for="event in dayEvents" v-show="view !== 'Actual'" :key="event.occurrenceKey" class="plan" :style="planStyle(event)">계획 · {{ event.title }}</div>
          <div v-for="row in dayRecords" :key="row.id" v-show="view !== 'Plan'" class="block" :style="actualStyle(row)"><b>{{ row.title }}</b><small>실제 기록 · {{ clock(recordingSeconds(row)) }}</small></div>
        </div>
      </div>
      <label for="actual-record-title">기록할 활동</label>
      <input id="actual-record-title" v-model="recordTitle" maxlength="200" :disabled="!!recording || recordBusy || !!pending" />
      <p v-if="recording" role="status">{{ recording.title }} · {{ pending?.kind === 'finish' ? '종료 저장 대기' : '기록 중' }} · {{ clock(elapsed) }}</p>
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
        <p>상태 {{ selectedRecord.state === 'COMPLETED' ? '서버 저장 완료' : '기록 중' }}</p>
      </section>
    </section>
    <section class="card" :style="{ order: order('tasks') }">
      <div class="head">
        <div><h3>오늘의 할 일</h3><p>완료하면 리듬이 기록돼요</p></div>
        <button @click="router.push({ path: '/tasks', query: { new: String(Date.now()) } })">＋</button>
      </div>
      <label class="task" v-for="task in tasks" :key="task.id"><input type="checkbox" :checked="task.done" @change="toggle(task)" /><span><b :class="{ done: task.done }">{{ task.title }}</b><small>{{ task.category }}</small></span></label>
      <div class="review">
        <span class="pill">DAILY REVIEW</span>
        <h3>오늘을 짧게 돌아볼까요?</h3>
        <p>{{ reviewText || content.reviewPrompt }}</p>
        <button @click="openPostComposer('회고', '', { date: reviewDate, body: reviewText })">{{ reviewText ? '회고 수정' : '회고 작성' }}</button>
      </div>
    </section>
  </div>
</template>
