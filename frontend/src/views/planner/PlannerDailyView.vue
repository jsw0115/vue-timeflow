<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasks, events, blocks, toggle, openPostComposer } from '../../store/appState'
import { eventOccurrences } from '../../utils/recurrence.mjs'
import { modeState, modeContent } from '../../store/modeProfiles'
import { dayLabel, cursor, shift, goToday } from '../../store/plannerDate'
import { plannerReviews } from '../../store/plannerReviews'
import { localDate } from '../../utils/postValidation.mjs'

const router = useRouter()
const route = useRoute()
watch(() => route.query.date, value => { if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(+new Date(value + 'T12:00:00'))) cursor.value = new Date(value + 'T12:00:00') }, { immediate: true })
const view = ref('모두')
const content = computed(() => modeContent(modeState.activeMode).planner)
function order(key) {
  return content.value.cardOrder[key]
}

/* 실제 기록 — 시작하면 경과 시간이 흐르고, 멈추면 타임바에 남는다 */
const recording = ref(false)
const elapsed = ref(0)
let timer = null
function toggleRecord() {
  recording.value = !recording.value
  if (recording.value) {
    elapsed.value = 0
    timer = setInterval(() => (elapsed.value += 1), 1000)
  } else {
    clearInterval(timer)
    timer = null
  }
}
function clock(sec) {
  return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0')
}
onBeforeUnmount(() => timer && clearInterval(timer))

/* 회고 — 저장하면 날짜별로 보관된다 */
const reviewDate = computed(() => localDate(cursor.value))
const dayEvents = computed(() => eventOccurrences(events.value, reviewDate.value, reviewDate.value))
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
          <div v-for="block in blocks" :key="block.title" v-show="view !== 'Plan'" :class="['block', block.color]" :style="{ top: block.top + '%', height: block.height + '%' }"><b>{{ block.title }}</b><small>Actual</small></div>
        </div>
      </div>
      <button class="record" :class="{ 'record-on': recording }" @click="toggleRecord">
        {{ recording ? '■ 기록 중지 · ' + clock(elapsed) : '● 지금부터 기록' }}
      </button>
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
