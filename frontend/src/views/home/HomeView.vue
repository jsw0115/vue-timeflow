<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { appearance } from '../../store/appearance'
import { tasks, routines, events, openPostComposer, toggle, toggleRoutine, isRoutineToday, routineStore } from '../../store/appState'
import { localDate } from '../../utils/postValidation.mjs'
import { eventOccurrences } from '../../utils/recurrence.mjs'
import { modeState, modeContent } from '../../store/modeProfiles'
import { dashboardState, WIDGET_CATALOG, cycleSize, toggleVisible, moveWidget, resetLayout } from '../../store/dashboard'
import QuickCapture from '../../components/QuickCapture.vue'
import { session } from '../../features/auth/session.js'
import { apiRequest } from '../../features/auth/apiRequest.js'
import { loadPublicContent, quoteOfDay } from '../../features/content/publicContent.mjs'
import { activityStore, applicationStore } from '../../store/careerLedger'
import { activityTypeLabel, dueLabel, recentActivities, upcomingDates } from '../../features/career/careerModel.mjs'

const router = useRouter()
// 커리어 요약 위젯: 로그인 계정의 서버 지원·활동 기록만 쓴다. 로그아웃이면 안내만 보인다
const careerUpcoming = computed(() => (session.userId ? upcomingDates(applicationStore.list.value, localDate(), 14).slice(0, 3) : []))
const careerRecent = computed(() => (session.userId ? recentActivities(activityStore.list.value, 1)[0] ?? null : null))

/* 통계 포틀릿용 데이터 — 통계 화면과 같은 지표를 홈에서도 본다 */
const CATEGORIES = [
  // 데이터 색 하나 + 중립 단계(DESIGN.md 2장 Category and chart colors). 범례 글자·비율이 함께 있어 색만으로 구분하지 않는다.
  { label: '업무', minutes: 252, color: 'var(--color-data)' },
  { label: '공부', minutes: 132, color: 'var(--color-foreground)' },
  { label: '건강', minutes: 108, color: 'var(--color-control-border)' },
  { label: '휴식', minutes: 108, color: 'var(--color-hairline)' },
]
const totalMinutes = CATEGORIES.reduce((s, c) => s + c.minutes, 0)
const donutStops = computed(() => {
  let acc = 0
  return CATEGORIES.map((c) => {
    const from = acc
    acc += (c.minutes / totalMinutes) * 100
    return c.color + ' ' + from.toFixed(1) + '% ' + acc.toFixed(1) + '%'
  }).join(', ')
})
const WEEKDAYS = [
  { d: '월', v: 82 }, { d: '화', v: 64 }, { d: '수', v: 91 }, { d: '목', v: 55 },
  { d: '금', v: 73 }, { d: '토', v: 38 }, { d: '일', v: 47 },
]
const PLAN_ACTUAL = [
  { label: '업무', plan: 70, actual: 60 },
  { label: '건강', plan: 40, actual: 48 },
  { label: '공부', plan: 30, actual: 18 },
  { label: '휴식', plan: 20, actual: 22 },
]
const bestStreak = computed(() => Math.max(0, ...routines.value.map((r) => r.streak ?? 0)))
const bestEver = computed(() => Math.max(0, ...routines.value.map((r) => r.best ?? 0)))
const todayRoutines = computed(() => routines.value.filter((r) => isRoutineToday(r)))
const doneRate = computed(() => tasks.value.length ? Math.round(tasks.value.filter(x => x.done).length / tasks.value.length * 100) : 0)
const routineDone = computed(() => todayRoutines.value.filter(r => r.done).length)
const routinePercent = computed(() => todayRoutines.value.length ? Math.round(routineDone.value / todayRoutines.value.length * 100) : 0)
// 오늘의 문장(Q-29): 관리자가 공개한 명언 중 날짜마다 하나. 로그인 상태에서만 서버에서 읽고, 없거나 못 읽으면 보이지 않는다
const publicContent = ref([])
watch(() => session.userId, async (id) => {
  publicContent.value = []
  if (!id) return
  try { const rows = await loadPublicContent(apiRequest); if (session.userId === id) publicContent.value = rows ?? [] } catch { publicContent.value = [] }
}, { immediate: true })
const quote = computed(() => quoteOfDay(publicContent.value, localDate()))
const todayEvents = computed(() => eventOccurrences(events.value, localDate(), localDate()).sort((a, b) => a.startTime.localeCompare(b.startTime)))
const pendingTasks = computed(() => tasks.value.filter(t => !t.done).length)
function shiftWidget(id, direction) {
  const index = visibleWidgets.value.findIndex(w => w.id === id)
  const neighbor = visibleWidgets.value[index + direction]
  if (neighbor) moveWidget(id, neighbor.id)
}
const godlifeScore = computed(() => {
  const routinePart = todayRoutines.value.length
    ? (todayRoutines.value.filter((r) => r.done).length / todayRoutines.value.length) * 50
    : 0
  const taskPart = (doneRate.value / 100) * 50
  return Math.round(routinePart + taskPart)
})

const content = computed(() => modeContent(modeState.activeMode).home)

// 점수 숨기기(UF-136)를 켜면 갓생 점수 위젯을 빼고 보인다. 저장된 배치는 바꾸지 않는다
const visibleWidgets = computed(() => dashboardState.layout.filter((w) => w.visible && !(appearance.hideScores && w.id === 'godlifeScore')))
const draggingId = ref(null)
function onDragStart(id) {
  draggingId.value = id
}
function onDrop(id) {
  if (draggingId.value && draggingId.value !== id) moveWidget(draggingId.value, id)
  draggingId.value = null
}
</script>

<template>
  <section class="home">
    <!-- 오늘 띠: 빠른 할 일 입력(주요 행동)과 오늘 수치를 한 구획에 둔다. 안에 카드를 겹치지 않는다(DESIGN.md 4장 Cards). -->
    <div class="today-band">
      <div class="quick-capture">
        <h2 class="today-question" v-html="content.heroTitle"></h2>
        <!-- 빠른 기록(PR-09 3단계): 해석 미리보기를 확인한 뒤 바로 저장한다. 오전·오후가 모호하면 고르기 전에는 일정으로 저장하지 않는다 -->
        <QuickCapture :placeholder="content.heroPlaceholder" />
      </div>
      <div class="today-side">
        <dl class="today-glance" aria-label="오늘 한눈에">
          <div><dt>오늘 일정</dt><dd class="figure">{{ todayEvents.length }}</dd></div>
          <div><dt>남은 할 일</dt><dd class="figure">{{ pendingTasks }}</dd></div>
          <div><dt>오늘 루틴</dt><dd class="figure">{{ routineDone }}<small>/{{ todayRoutines.length }}</small></dd></div>
        </dl>
        <figure v-if="quote" class="today-quote" aria-label="오늘의 문장">
          <blockquote>{{ quote.text }}</blockquote>
          <figcaption v-if="quote.by">{{ quote.by }}</figcaption>
        </figure>
        <div class="today-links"><button type="button" class="button-text" @click="openPostComposer('일정')">일정 추가</button><button type="button" class="button-text" @click="router.push('/routines')">루틴 확인</button><button type="button" class="button-text" @click="openPostComposer('다이어리')">하루 회고</button></div>
      </div>
    </div>

    <section class="dashboard" aria-labelledby="dashboard-title">
    <div class="widget-toolbar">
      <div class="widget-toolbar-copy"><h2 id="dashboard-title">나의 대시보드</h2><p>{{ dashboardState.editing ? '이동 버튼이나 드래그로 순서를 바꾸세요. 숨긴 카드는 위젯 관리에서 복원할 수 있어요.' : '오늘의 할 일을 한눈에 보고 바로 실행하세요.' }}</p></div>
      <div class="filter">
        <button :class="{ selected: !dashboardState.editing }" @click="dashboardState.editing = false">보기</button>
        <button :class="{ selected: dashboardState.editing }" @click="dashboardState.editing = true">화면 편집</button>
      </div>
      <button v-if="dashboardState.editing" class="icon" title="위젯 관리" aria-label="위젯 관리" @click="router.push('/settings/widgets')">▦</button>
      <button v-if="dashboardState.editing" class="icon" title="레이아웃 초기화" aria-label="레이아웃 초기화" @click="resetLayout">↺</button>
    </div>

    <div class="widget-grid">
      <article
        v-for="w in visibleWidgets"
        :key="w.id"
        class="widget"
        :class="[
          'w-' + w.size,
          { editing: dashboardState.editing, dragging: draggingId === w.id, dday: w.id === 'dday', routine: w.id === 'routine', 'metric-widget': ['tasksProgress', 'routineRate', 'focusTime', 'eventsCount'].includes(w.id) },
        ]"
        :draggable="dashboardState.editing"
        @dragstart="onDragStart(w.id)"
        @dragover.prevent
        @drop="onDrop(w.id)"
      >
        <div v-if="dashboardState.editing" class="widget-editbar">
          <span class="grip">⠿</span>
          <span style="flex: 1">{{ WIDGET_CATALOG[w.id]?.title }}</span>
          <button class="review" :disabled="visibleWidgets[0]?.id === w.id" :aria-label="WIDGET_CATALOG[w.id]?.title + ' 앞으로 이동'" @click="shiftWidget(w.id, -1)">앞으로</button>
          <button class="review" :disabled="visibleWidgets.at(-1)?.id === w.id" :aria-label="WIDGET_CATALOG[w.id]?.title + ' 뒤로 이동'" @click="shiftWidget(w.id, 1)">뒤로</button>
          <button class="icon" style="width: 26px; height: 26px; font-size: 0.875rem" title="크기 변경" aria-label="크기 변경" @click="cycleSize(w.id)">⤢</button>
          <button class="icon" style="width: 26px; height: 26px; font-size: 0.875rem" title="숨기기" aria-label="숨기기" @click="toggleVisible(w.id)">✕</button>
        </div>

        <span v-if="['focusTime', 'dday', 'categoryDonut', 'weekdayBar', 'planVsActual'].includes(w.id)" class="sample-label">시연용 예시 데이터</span>
        <template v-if="w.id === 'events'">
          <div class="head"><div><h3>오늘의 흐름</h3><p>계획과 실제 기록을 확인하세요</p></div><button @click="router.push('/planner')">플래너 열기 →</button></div>
          <div class="event" v-for="event in todayEvents" :key="event.title"><time>{{ event.time }}</time><i></i><span><b>{{ event.title }}</b><small>{{ event.tag }} · 종료 {{ event.endDate }} {{ event.endTime }}</small></span></div>
          <p v-if="!todayEvents.length" class="empty-state">오늘 예정된 일정이 없어요. '플래너 열기'에서 하루를 계획해 보세요.</p>
        </template>

        <template v-else-if="w.id === 'routine'">
          <div class="head"><div><h3>오늘의 루틴</h3><p>작은 반복이 하루를 만들어요</p></div><button @click="router.push('/routines')">전체 보기 →</button></div>
          <label v-for="item in todayRoutines" :key="item.id"><input type="checkbox" :checked="item.done" :aria-busy="routineStore.isBusy(item) ? 'true' : undefined" @click.prevent="toggleRoutine(item)" /><span :class="{ done: item.done }">{{ item.title }}</span><small>{{ item.time }} · {{ item.streak }}일 연속</small></label>
          <p v-if="!todayRoutines.length" class="empty-state">오늘 예정된 루틴이 없어요. '전체 보기'에서 루틴을 만들거나 쉬는 날을 확인해 보세요.</p>
        </template>

        <template v-else-if="w.id === 'tasksProgress'">
          <span>할 일 진행</span><b>{{ doneRate }}<small>%</small></b>
          <div class="progress"><em :style="{ width: doneRate + '%' }"></em></div>
          <p>{{ tasks.filter((x) => x.done).length }}/{{ tasks.length }} 완료</p>
        </template>

        <template v-else-if="w.id === 'routineRate'">
          <span>루틴 달성률</span><b>{{ routinePercent }}<small>%</small></b>
          <div class="progress green"><em :style="{ width: routinePercent + '%' }"></em></div><p>{{ routineDone }}/{{ todayRoutines.length }} 완료</p>
        </template>

        <template v-else-if="w.id === 'focusTime'">
          <span>집중 시간</span><b>2<small>h 40m</small></b><p>어제보다 24분 더 집중했어요</p>
        </template>

        <template v-else-if="w.id === 'eventsCount'">
          <span>오늘 일정</span><b>{{ todayEvents.length }}<small>개</small></b><p>{{ todayEvents[0] ? todayEvents[0].time + ' · ' + todayEvents[0].title : '등록된 일정이 없어요' }}</p>
        </template>

        <template v-else-if="w.id === 'categoryDonut'">
          <div class="head"><div><h3>카테고리 비중</h3><p>이번 주 기록 시간</p></div><button @click="router.push('/stats')">통계 →</button></div>
          <div class="donut-wrap">
            <div class="donut" :style="{ background: 'conic-gradient(' + donutStops + ')' }"><span class="figure">{{ Math.round(totalMinutes / 60) }}h</span></div>
            <ul class="donut-legend">
              <li v-for="c in CATEGORIES" :key="c.label"><i :style="{ background: c.color }"></i>{{ c.label }}<b class="figure">{{ Math.round((c.minutes / totalMinutes) * 100) }}%</b></li>
            </ul>
          </div>
        </template>

        <template v-else-if="w.id === 'weekdayBar'">
          <div class="head"><div><h3>요일별 패턴</h3><p>어느 요일에 잘 기록했는지</p></div></div>
          <div class="chart" style="height: 150px">
            <div v-for="d in WEEKDAYS" :key="d.d"><b :style="{ height: d.v + '%' }"></b><small>{{ d.d }}</small></div>
          </div>
        </template>

        <template v-else-if="w.id === 'planVsActual'">
          <div class="head"><div><h3>계획 대비 실제</h3><p>이번 주 카테고리별</p></div><button @click="router.push('/stats/compare')">비교 분석 →</button></div>
          <div class="chart" style="height: 150px">
            <div v-for="b in PLAN_ACTUAL" :key="b.label"><i :style="{ height: b.plan + '%' }"></i><b :style="{ height: b.actual + '%' }"></b><small>{{ b.label }}</small></div>
          </div>
          <div class="chart-legend"><span><i class="swatch plan"></i>계획</span><span><i class="swatch actual"></i>실제 기록</span></div>
        </template>

        <template v-else-if="w.id === 'streak'">
          <span>연속 기록</span><b class="figure">{{ bestStreak }}<small>일</small></b>
          <p>가장 긴 루틴 · 최고 {{ bestEver }}일</p>
        </template>

        <template v-else-if="w.id === 'godlifeScore'">
          <span>갓생 점수</span><b class="figure">{{ godlifeScore }}<small>점</small></b>
          <p>루틴 50% + 할 일 50%</p>
        </template>

        <template v-else-if="w.id === 'career'">
          <div class="head"><div><h3>커리어 요약</h3><p>14일 안 지원 마감·면접과 최근 활동</p></div><button @click="router.push('/career')">커리어 대시보드 →</button></div>
          <p v-if="!session.userId" class="empty-state">로그인하면 지원 마감과 최근 활동을 볼 수 있어요. 로그아웃 상태에서는 커리어 기록을 저장하지 않아요.</p>
          <template v-else>
            <div v-for="row in careerUpcoming" :key="row.id" class="event"><time class="figure">{{ row.date.slice(5) }}</time><i></i><span><b>{{ row.company }} · {{ row.title }}</b><small>{{ row.label }} · {{ dueLabel(row.days) }}</small></span></div>
            <p v-if="!careerUpcoming.length" class="empty-state">14일 안에 다가오는 지원 마감이나 면접이 없어요. 취업·이직 지원에서 마감 날짜를 넣으면 여기에 보여요.</p>
            <p v-if="careerRecent" class="career-recent"><span class="tag">{{ activityTypeLabel(careerRecent.activityType) }}</span> 최근 활동 · {{ careerRecent.title }} <span class="figure">{{ careerRecent.date }}</span></p>
          </template>
        </template>
        <template v-else-if="w.id === 'dday'">
          <span class="eyebrow">다가오는 날</span>
          <h3>엄마 생신까지</h3>
          <b>D-7</b>
          <p>8월 22일 · 저녁 식사</p>
          <button @click="router.push('/dday')">일정 보기 →</button>
        </template>
      </article>
    </div>
    </section>
  </section>
</template>

<style scoped>
.home { display: grid; gap: var(--space-block); }
.today-band {
  display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: var(--space-block); align-items: center;
  padding: var(--space-xxl) var(--space-block); border-radius: var(--radius-xl); background: var(--color-surface);
}
.today-question { margin: 0 0 var(--space-xl); font-size: var(--type-title-lg-size); }
.today-side { display: grid; gap: var(--space-xl); padding-left: var(--space-block); border-left: 1px solid var(--color-hairline); }
.today-glance { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-xl); margin: 0; }
.today-glance dt { font-size: var(--type-body-sm-size); color: var(--color-body); }
.today-glance dd { margin: var(--space-xs) 0 0; font-size: 1.75rem; font-weight: 500; line-height: 1.2; color: var(--color-foreground); }
.today-glance dd small { font-size: var(--type-body-sm-size); color: var(--color-muted); }
.dashboard { display: grid; gap: var(--space-xl); }
.dashboard .widget-toolbar { margin: 0; }
.widget-toolbar-copy h2 { font-size: var(--type-title-md-size); }
.today-links { display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-left: calc(var(--space-lg) * -1); }
@media (max-width: 1000px) {
  .today-band { grid-template-columns: minmax(0, 1fr); padding: var(--space-xxl); }
  .today-side { padding-left: 0; padding-top: var(--space-xl); border-left: 0; border-top: 1px solid var(--color-hairline); }
}
@media (max-width: 600px) {
  .today-band { padding: var(--space-xl); }
}
.career-recent { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-xs); margin: var(--space-sm) 0 0; color: var(--color-body); font-size: var(--type-body-sm-size); overflow-wrap: anywhere; }
/* 오늘의 문장(Q-29). 주 행동(빠른 기록)보다 눈에 띄지 않게 작은 글씨와 흐린 색으로 둔다 */
.today-quote { margin: var(--space-md) 0 0; color: var(--color-muted); font-size: var(--type-body-sm-size); }
.today-quote blockquote { margin: 0; overflow-wrap: anywhere; }
.today-quote figcaption { margin-top: var(--space-xs); font-size: var(--type-caption-size); }
</style>
