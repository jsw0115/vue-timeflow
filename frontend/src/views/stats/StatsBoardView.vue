<script setup>
import { bodyLocale, tr, unit as unitText } from '../../store/locale'
import { formatDate, modeText } from '../../features/i18n/locale.mjs'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { appearance } from '../../store/appearance'
import Modal from '../../components/Modal.vue'
import { session } from '../../features/auth/session.js'
import { statsClient } from '../../features/stats/stats.js'
import { FIGURES, RANGES as SERVER_RANGES, figureSummary, sourcePath, statsErrorText } from '../../features/stats/statsClient.mjs'
import {
  STATS_CATALOG,
  statsState,
  toggleStatsPortlet,
  moveStatsPortlet,
  resetStatsPortlets,
} from '../../store/statsPortlets'
import { modeState, modeMeta } from '../../store/modeProfiles'
import PageActions from '../../components/PageActions.vue'

/**
 * 통계 보드 — 포틀릿을 사용자가 직접 켜고 끄고 순서를 바꾼다.
 * 기본 구성은 J/P/B 모드 템플릿에서 오고, 바꾸면 그 모드에만 저장된다.
 */
const RANGES = ['이번 주', '이번 달', '올해']
const range = ref('이번 주')
const showConfig = ref(false)

// 점수 숨기기(UF-136)를 켜면 갓생 점수 포틀릿을 빼고 보인다. 저장된 구성은 바꾸지 않는다
const visible = computed(() => statsState.portlets.filter((p) => p.visible && !(appearance.hideScores && p.id === 'godlifeScore')))
const scale = computed(() => ({ '이번 주': 1, '이번 달': 4.3, 올해: 52 })[range.value])
const unit = computed(() => ({ '이번 주': '주', '이번 달': '월', 올해: '년' })[range.value])

// 한눈에 보기는 로그인 계정의 실제 기록으로 서버가 집계한 수치다. 수치를 누르면 그 수치를 만든 원본 목록으로 간다(PR-10 6단계, UF-118)
const router = useRouter()
const serverRange = computed(() => SERVER_RANGES.find((r) => r.label === range.value)?.id ?? 'week')
const stats = ref(null)
const statsStatus = ref('idle')
const statsError = ref('')
async function loadStats() {
  if (!session.userId) { stats.value = null; statsStatus.value = 'idle'; return }
  statsStatus.value = 'loading'
  statsError.value = ''
  try { stats.value = await statsClient.dashboard(serverRange.value); statsStatus.value = 'ready' } catch (e) { statsError.value = statsErrorText(e); statsStatus.value = 'error' }
}
watch(() => [session.userId, serverRange.value], loadStats, { immediate: true })
const figures = computed(() => (stats.value ? FIGURES.map((f) => figureSummary(stats.value, f.key, tr)) : []))
function openSource(key) {
  router.push(sourcePath(key, serverRange.value, stats.value))
}

const CATEGORIES = [
  { label: '업무', minutes: 252, color: 'var(--color-accent)' },
  { label: '공부', minutes: 132, color: 'var(--color-foreground)' },
  { label: '건강', minutes: 108, color: '#8a6a3c' },
  { label: '휴식', minutes: 108, color: 'var(--color-hairline)' },
]
const totalMinutes = computed(() => Math.round(CATEGORIES.reduce((s, c) => s + c.minutes, 0) * scale.value))
const donutStops = computed(() => {
  let acc = 0
  const total = CATEGORIES.reduce((s, c) => s + c.minutes, 0)
  return CATEGORIES.map((c) => {
    const from = acc
    acc += (c.minutes / total) * 100
    return c.color + ' ' + from.toFixed(1) + '% ' + acc.toFixed(1) + '%'
  }).join(', ')
})

const WEEKDAYS = [
  { d: '월', v: 82 }, { d: '화', v: 64 }, { d: '수', v: 91 }, { d: '목', v: 55 },
  { d: '금', v: 73 }, { d: '토', v: 38 }, { d: '일', v: 47 },
]
const HOURS = Array.from({ length: 24 }, (_, h) => ({
  h,
  v: Math.round(Math.abs(Math.sin((h + 2) * 0.7)) * (h >= 7 && h <= 23 ? 100 : 18)),
}))
const PLAN_ACTUAL = [
  { label: '업무', plan: 70, actual: 60 },
  { label: '건강', plan: 40, actual: 48 },
  { label: '공부', plan: 30, actual: 18 },
  { label: '휴식', plan: 20, actual: 22 },
]
const ROUTINES = [
  { name: '물 2L 마시기', rate: 92 },
  { name: '하루 회고 5분', rate: 78 },
  { name: '영어 단어 20개', rate: 61 },
  { name: '아침 스트레칭', rate: 44 },
]
const FOCUS_TREND = [120, 150, 96, 180, 210, 165, 190]
const THROUGHPUT = [
  { label: '완료', values: [6, 8, 5, 9, 7, 4, 6] },
  { label: '이월', values: [2, 1, 3, 1, 2, 3, 1] },
]

function hm(min) {
  return tr('{n}시간 {m}분', { n: Math.floor(min / 60), m: min % 60 })
}
// 요일 이름(월요일부터)은 본문 언어로 보인다. 2024-01-01은 월요일이다
const weekdayName = (i) => (bodyLocale.value === 'ko' ? WEEKDAYS[i].d : formatDate(new Date(2024, 0, 1 + i), bodyLocale.value, { weekday: 'short' }))
const maxFocus = Math.max(...FOCUS_TREND)
const focusPath = FOCUS_TREND.map((v, i) => (i * 100) / (FOCUS_TREND.length - 1) + ',' + (60 - (v / maxFocus) * 55)).join(' ')
</script>

<template>
  <div class="page-tools">
    <div class="filter">
      <button v-for="r in RANGES" :key="r" :class="{ selected: range === r }" @click="range = r">{{ tr(r) }}</button>
    </div>
    <span class="form-note" style="margin: 0">
      {{ tr('{mode} 기본 구성 · 포틀릿 {n}개', { mode: modeText(modeState.activeMode, bodyLocale, modeMeta(modeState.activeMode)).name, n: visible.length }) }}
    </span>
    <PageActions><button class="primary" @click="showConfig = true">{{ tr('포틀릿 구성') }}</button></PageActions>
  </div>
  <p class="input-field-help stat-demo-note" role="note">{{ tr('한눈에 보기 밖의 포틀릿은 아직 시연 데이터예요. 실제 기록으로 계산한 수치는 한눈에 보기에 있어요.') }}</p>

  <div class="stats-board">
    <template v-for="p in visible" :key="p.id">
      <!-- 한눈에 보기 -->
      <section v-if="p.id === 'summary'" class="card stats-portlet wide">
        <h3>{{ tr(STATS_CATALOG.summary.title) }}</h3>
        <p v-if="!session.userId" class="form-note">{{ tr('로그인하면 내 계정의 실제 기록으로 계산한 수치를 볼 수 있어요. 수치를 누르면 그 수치를 만든 기록이 보여요.') }}</p>
        <p v-else-if="statsStatus === 'loading' && !stats" class="input-field-help" role="status">{{ tr('수치를 불러오는 중이에요.') }}</p>
        <p v-else-if="statsStatus === 'error'" class="input-field-help" data-state="error" role="alert">{{ tr(statsError) }} <button type="button" class="button-secondary" @click="loadStats">{{ tr('다시 시도') }}</button></p>
        <template v-else-if="stats">
          <div class="stat-figures">
            <button v-for="f in figures" :key="f.key" type="button" class="stat-figure" :aria-label="tr('{name} {value}, 원본 {n}건 보기', { name: f.label, value: f.text, n: f.count })" @click="openSource(f.key)">
              <span>{{ f.label }}</span>
              <b :class="f.empty ? 'stat-figure-empty' : 'figure'">{{ f.text }}</b>
              <small>{{ tr('기록 {n}건 · 원본 보기', { n: f.count }) }}</small>
            </button>
          </div>
          <p class="input-field-help stat-meta">{{ tr('집계 기간') }} <span class="figure">{{ figures[0].period }}</span> · {{ figures[0].zone }}</p>
        </template>
      </section>

      <!-- 카테고리 도넛 -->
      <section v-else-if="p.id === 'categoryDonut'" class="card stats-portlet">
        <h3>{{ tr(STATS_CATALOG.categoryDonut.title) }}</h3>
        <div class="donut-wrap">
          <div class="donut" :style="{ background: 'conic-gradient(' + donutStops + ')' }">
            <span class="figure">{{ Math.round(totalMinutes / 60) }}h</span>
          </div>
          <ul class="donut-legend">
            <li v-for="c in CATEGORIES" :key="c.label">
              <i :style="{ background: c.color }"></i>{{ tr(c.label) }}
              <b class="figure">{{ Math.round((c.minutes / 528) * 100) }}%</b>
            </li>
          </ul>
        </div>
      </section>

      <!-- 요일별 패턴 -->
      <section v-else-if="p.id === 'weekdayBar'" class="card stats-portlet">
        <h3>{{ tr(STATS_CATALOG.weekdayBar.title) }}</h3>
        <div class="chart" style="margin-top: 12px">
          <div v-for="(w, i) in WEEKDAYS" :key="w.d"><b :style="{ height: w.v + '%' }"></b><small>{{ weekdayName(i) }}</small></div>
        </div>
      </section>

      <!-- 시간대 히트맵 -->
      <section v-else-if="p.id === 'hourHeat'" class="card stats-portlet wide">
        <h3>{{ tr(STATS_CATALOG.hourHeat.title) }}</h3>
        <div class="heat-row">
          <i v-for="h in HOURS" :key="h.h" :style="{ opacity: 0.12 + (h.v / 100) * 0.88 }" :title="tr('{h}시 · {v}', { h: h.h, v: h.v })"></i>
        </div>
        <div class="heat-axis"><span>{{ tr('0시') }}</span><span>{{ tr('6시') }}</span><span>{{ tr('12시') }}</span><span>{{ tr('18시') }}</span><span>{{ tr('23시') }}</span></div>
      </section>

      <!-- 계획 대비 실제 -->
      <section v-else-if="p.id === 'planVsActual'" class="card stats-portlet">
        <h3>{{ tr(STATS_CATALOG.planVsActual.title) }}</h3>
        <div class="chart" style="margin-top: 12px">
          <div v-for="b in PLAN_ACTUAL" :key="b.label"><i :style="{ height: b.plan + '%' }"></i><b :style="{ height: b.actual + '%' }"></b><small>{{ tr(b.label) }}</small></div>
        </div>
        <div class="chart-legend"><span><i class="swatch plan"></i>{{ tr('계획') }}</span><span><i class="swatch actual"></i>{{ tr('실제 기록') }}</span></div>
      </section>

      <!-- 연속 기록 -->
      <section v-else-if="p.id === 'streak'" class="card stats-portlet">
        <h3>{{ tr(STATS_CATALOG.streak.title) }}</h3>
        <div class="metrics" style="--metric-cols: 2; margin-top: 12px">
          <article><span>{{ tr('현재 연속') }}</span><b class="figure">12<small>{{ unitText('일') }}</small></b></article>
          <article><span>{{ tr('최장 연속') }}</span><b class="figure">31<small>{{ unitText('일') }}</small></b></article>
        </div>
        <p class="form-note">{{ tr('이월한 날이 있어도 연속은 끊기지 않아요.') }}</p>
      </section>

      <!-- 루틴 달성률 -->
      <section v-else-if="p.id === 'routineRate'" class="card stats-portlet">
        <h3>{{ tr(STATS_CATALOG.routineRate.title) }}</h3>
        <div v-for="r in ROUTINES" :key="r.name" class="rate-row">
          <span>{{ tr(r.name) }}</span>
          <div class="progress"><em :style="{ width: r.rate + '%' }"></em></div>
          <b class="figure">{{ r.rate }}%</b>
        </div>
      </section>

      <!-- 집중 시간 추이 -->
      <section v-else-if="p.id === 'focusTrend'" class="card stats-portlet">
        <h3>{{ tr(STATS_CATALOG.focusTrend.title) }}</h3>
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" class="spark">
          <polyline :points="focusPath" fill="none" stroke="var(--color-data)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <p class="form-note">{{ tr({ 주: '최근 7일 · 평균 {avg}', 월: '최근 7월 · 평균 {avg}', 년: '최근 7년 · 평균 {avg}' }[unit], { avg: hm(Math.round(FOCUS_TREND.reduce((a, b) => a + b, 0) / FOCUS_TREND.length)) }) }}</p>
      </section>

      <!-- 할 일 처리량 -->
      <section v-else-if="p.id === 'taskThroughput'" class="card stats-portlet">
        <h3>{{ tr(STATS_CATALOG.taskThroughput.title) }}</h3>
        <div class="chart" style="margin-top: 12px">
          <div v-for="(v, i) in THROUGHPUT[0].values" :key="i">
            <i :style="{ height: THROUGHPUT[1].values[i] * 10 + '%' }"></i>
            <b :style="{ height: v * 10 + '%' }"></b>
            <small>{{ i + 1 }}</small>
          </div>
        </div>
        <div class="chart-legend"><span><i class="swatch plan"></i>{{ tr('이월') }}</span><span><i class="swatch actual"></i>{{ tr('완료') }}</span></div>
      </section>

      <!-- 갓생 점수 -->
      <section v-else-if="p.id === 'godlifeScore'" class="card stats-portlet">
        <h3>{{ tr(STATS_CATALOG.godlifeScore.title) }}</h3>
        <b class="figure godlife-score">{{ Math.round(78 + scale) }}</b>
        <p class="form-note">{{ tr('루틴 40% · 집중 35% · 기록 25% 가중 합산') }}</p>
      </section>
    </template>
  </div>

  <Modal v-if="showConfig" :title="tr('포틀릿 구성')" wide @close="showConfig = false">
    <p class="form-note" style="margin-top: 0">
      {{ tr('지금은 {mode} 기준이에요. 여기서 바꾼 구성은 이 모드에만 저장되고, 다른 모드는 그대로 유지돼요.', { mode: modeText(modeState.activeMode, bodyLocale, modeMeta(modeState.activeMode)).name }) }}
    </p>
    <div class="portlet-config">
      <div v-for="(p, i) in statsState.portlets" :key="p.id" class="portlet-row">
        <label class="portlet-toggle">
          <input type="checkbox" :checked="p.visible" @change="toggleStatsPortlet(p.id)" />
          <span><b>{{ tr(STATS_CATALOG[p.id].title) }}</b><small>{{ tr(STATS_CATALOG[p.id].desc) }}</small></span>
        </label>
        <span class="tag">{{ STATS_CATALOG[p.id].kind }}</span>
        <button class="review" style="margin: 0" :disabled="i === 0" @click="moveStatsPortlet(p.id, -1)">↑</button>
        <button class="review" style="margin: 0" :disabled="i === statsState.portlets.length - 1" @click="moveStatsPortlet(p.id, 1)">↓</button>
      </div>
    </div>

    <template #footer>
      <div class="form-row">
      <button class="review" style="margin: 0" @click="resetStatsPortlets">{{ tr('모드 기본값으로 되돌리기') }}</button>
      <button class="primary" style="flex: 1" @click="showConfig = false">{{ tr('완료') }}</button>
          </div>
    </template>
  </Modal>
</template>

<style scoped>
.stat-demo-note { margin: 0 0 var(--space-lg); }
.stat-figures { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-lg); margin-top: var(--space-lg); }
.stat-figure { display: grid; gap: var(--space-sm); align-content: start; text-align: left; padding: var(--space-lg); background: var(--color-card); border: 1px solid var(--color-hairline); border-radius: var(--radius-md); color: var(--color-foreground); cursor: pointer; transition: border-color .15s; }
.stat-figure:hover { border-color: var(--color-foreground); }
.stat-figure > span { color: var(--color-muted); font-size: var(--type-body-size); }
.stat-figure b { font-size: 1.375rem; font-weight: var(--type-figure-weight); line-height: 1.2; }
.stat-figure small { color: var(--color-muted); font-size: var(--type-caption-size); }
/* 원본이 없는 수치는 큰 숫자 자리에 문장을 크게 쓰지 않고, 같은 줄 높이를 지키는 보조 글자로 보인다 */
.stat-figure b.stat-figure-empty { color: var(--color-muted); font-size: var(--type-body-size); font-weight: 500; line-height: 1.65rem; }
.stat-meta { margin: var(--space-lg) 0 0; }
@media (max-width: 1150px) { .stat-figures { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 420px) { .stat-figures { grid-template-columns: minmax(0, 1fr); } }
</style>
