<script setup>
import { computed, ref } from 'vue'
import Modal from '../../components/Modal.vue'
import {
  STATS_CATALOG,
  statsState,
  toggleStatsPortlet,
  moveStatsPortlet,
  resetStatsPortlets,
} from '../../store/statsPortlets'
import { modeState, modeMeta } from '../../store/modeProfiles'

/**
 * 통계 보드 — 포틀릿을 사용자가 직접 켜고 끄고 순서를 바꾼다.
 * 기본 구성은 J/P/B 모드 템플릿에서 오고, 바꾸면 그 모드에만 저장된다.
 */
const RANGES = ['이번 주', '이번 달', '올해']
const range = ref('이번 주')
const showConfig = ref(false)

const visible = computed(() => statsState.portlets.filter((p) => p.visible))
const scale = computed(() => ({ '이번 주': 1, '이번 달': 4.3, 올해: 52 })[range.value])
const unit = computed(() => ({ '이번 주': '주', '이번 달': '월', 올해: '년' })[range.value])

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
  return Math.floor(min / 60) + '시간 ' + (min % 60) + '분'
}
const maxFocus = Math.max(...FOCUS_TREND)
const focusPath = FOCUS_TREND.map((v, i) => (i * 100) / (FOCUS_TREND.length - 1) + ',' + (60 - (v / maxFocus) * 55)).join(' ')
</script>

<template>
  <div class="page-tools">
    <div class="filter">
      <button v-for="r in RANGES" :key="r" :class="{ selected: range === r }" @click="range = r">{{ r }}</button>
    </div>
    <span class="form-note" style="margin: 0">
      {{ modeMeta(modeState.activeMode).name }} 기본 구성 · 포틀릿 {{ visible.length }}개
    </span>
    <button class="primary" @click="showConfig = true">포틀릿 구성</button>
  </div>

  <div class="stats-board">
    <template v-for="p in visible" :key="p.id">
      <!-- 한눈에 보기 -->
      <section v-if="p.id === 'summary'" class="card stats-portlet wide">
        <h3>{{ STATS_CATALOG.summary.title }}</h3>
        <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin-top: 12px">
          <article><span>총 기록 시간</span><b class="figure">{{ hm(totalMinutes) }}</b></article>
          <article><span>계획 달성률</span><b class="figure">87<small>%</small></b></article>
          <article><span>완료 할 일</span><b class="figure">{{ Math.round(41 * scale) }}<small>건</small></b></article>
          <article><span>기록한 날</span><b class="figure">{{ Math.round(6 * scale) }}<small>일</small></b></article>
        </div>
      </section>

      <!-- 카테고리 도넛 -->
      <section v-else-if="p.id === 'categoryDonut'" class="card stats-portlet">
        <h3>{{ STATS_CATALOG.categoryDonut.title }}</h3>
        <div class="donut-wrap">
          <div class="donut" :style="{ background: 'conic-gradient(' + donutStops + ')' }">
            <span class="figure">{{ Math.round(totalMinutes / 60) }}h</span>
          </div>
          <ul class="donut-legend">
            <li v-for="c in CATEGORIES" :key="c.label">
              <i :style="{ background: c.color }"></i>{{ c.label }}
              <b class="figure">{{ Math.round((c.minutes / 528) * 100) }}%</b>
            </li>
          </ul>
        </div>
      </section>

      <!-- 요일별 패턴 -->
      <section v-else-if="p.id === 'weekdayBar'" class="card stats-portlet">
        <h3>{{ STATS_CATALOG.weekdayBar.title }}</h3>
        <div class="chart" style="margin-top: 12px">
          <div v-for="w in WEEKDAYS" :key="w.d"><b :style="{ height: w.v + '%' }"></b><small>{{ w.d }}</small></div>
        </div>
      </section>

      <!-- 시간대 히트맵 -->
      <section v-else-if="p.id === 'hourHeat'" class="card stats-portlet wide">
        <h3>{{ STATS_CATALOG.hourHeat.title }}</h3>
        <div class="heat-row">
          <i v-for="h in HOURS" :key="h.h" :style="{ opacity: 0.12 + (h.v / 100) * 0.88 }" :title="h.h + '시 · ' + h.v"></i>
        </div>
        <div class="heat-axis"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>23시</span></div>
      </section>

      <!-- 계획 대비 실제 -->
      <section v-else-if="p.id === 'planVsActual'" class="card stats-portlet">
        <h3>{{ STATS_CATALOG.planVsActual.title }}</h3>
        <div class="chart" style="margin-top: 12px">
          <div v-for="b in PLAN_ACTUAL" :key="b.label"><i :style="{ height: b.plan + '%' }"></i><b :style="{ height: b.actual + '%' }"></b><small>{{ b.label }}</small></div>
        </div>
        <div class="chart-legend"><span><i class="swatch plan"></i>계획</span><span><i class="swatch actual"></i>실제</span></div>
      </section>

      <!-- 연속 기록 -->
      <section v-else-if="p.id === 'streak'" class="card stats-portlet">
        <h3>{{ STATS_CATALOG.streak.title }}</h3>
        <div class="metrics" style="grid-template-columns: 1fr 1fr; margin-top: 12px">
          <article><span>현재 연속</span><b class="figure">12<small>일</small></b></article>
          <article><span>최장 연속</span><b class="figure">31<small>일</small></b></article>
        </div>
        <p class="form-note">이월한 날이 있어도 연속은 끊기지 않아요.</p>
      </section>

      <!-- 루틴 달성률 -->
      <section v-else-if="p.id === 'routineRate'" class="card stats-portlet">
        <h3>{{ STATS_CATALOG.routineRate.title }}</h3>
        <div v-for="r in ROUTINES" :key="r.name" class="rate-row">
          <span>{{ r.name }}</span>
          <div class="progress"><em :style="{ width: r.rate + '%' }"></em></div>
          <b class="figure">{{ r.rate }}%</b>
        </div>
      </section>

      <!-- 집중 시간 추이 -->
      <section v-else-if="p.id === 'focusTrend'" class="card stats-portlet">
        <h3>{{ STATS_CATALOG.focusTrend.title }}</h3>
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" class="spark">
          <polyline :points="focusPath" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <p class="form-note">최근 7{{ unit === '주' ? '일' : unit }} · 평균 {{ hm(Math.round(FOCUS_TREND.reduce((a, b) => a + b, 0) / FOCUS_TREND.length)) }}</p>
      </section>

      <!-- 할 일 처리량 -->
      <section v-else-if="p.id === 'taskThroughput'" class="card stats-portlet">
        <h3>{{ STATS_CATALOG.taskThroughput.title }}</h3>
        <div class="chart" style="margin-top: 12px">
          <div v-for="(v, i) in THROUGHPUT[0].values" :key="i">
            <i :style="{ height: THROUGHPUT[1].values[i] * 10 + '%' }"></i>
            <b :style="{ height: v * 10 + '%' }"></b>
            <small>{{ i + 1 }}</small>
          </div>
        </div>
        <div class="chart-legend"><span><i class="swatch plan"></i>이월</span><span><i class="swatch actual"></i>완료</span></div>
      </section>

      <!-- 갓생 점수 -->
      <section v-else-if="p.id === 'godlifeScore'" class="card stats-portlet">
        <h3>{{ STATS_CATALOG.godlifeScore.title }}</h3>
        <b class="figure godlife-score">{{ Math.round(78 + scale) }}</b>
        <p class="form-note">루틴 40% · 집중 35% · 기록 25% 가중 합산</p>
      </section>
    </template>
  </div>

  <Modal v-if="showConfig" title="포틀릿 구성" wide @close="showConfig = false">
    <p class="form-note" style="margin-top: 0">
      지금은 <b>{{ modeMeta(modeState.activeMode).name }}</b> 기준이에요. 여기서 바꾼 구성은 이 모드에만 저장되고, 다른 모드는 그대로 유지돼요.
    </p>
    <div class="portlet-config">
      <div v-for="(p, i) in statsState.portlets" :key="p.id" class="portlet-row">
        <label class="portlet-toggle">
          <input type="checkbox" :checked="p.visible" @change="toggleStatsPortlet(p.id)" />
          <span><b>{{ STATS_CATALOG[p.id].title }}</b><small>{{ STATS_CATALOG[p.id].desc }}</small></span>
        </label>
        <span class="tag">{{ STATS_CATALOG[p.id].kind }}</span>
        <button class="review" style="margin: 0" :disabled="i === 0" @click="moveStatsPortlet(p.id, -1)">↑</button>
        <button class="review" style="margin: 0" :disabled="i === statsState.portlets.length - 1" @click="moveStatsPortlet(p.id, 1)">↓</button>
      </div>
    </div>
    <div class="form-row">
      <button class="review" style="margin: 0" @click="resetStatsPortlets">모드 기본값으로 되돌리기</button>
      <button class="primary" style="flex: 1" @click="showConfig = false">완료</button>
    </div>
  </Modal>
</template>
