<script setup>
import { computed, ref } from 'vue'

/**
 * 계획(plan) 대비 실제(actual)를 일/주/달 단위로 비교한다.
 * 목표 달성 확률은 최근 달성률의 평균·표준편차로 정규근사해 추정한다(간이 모델).
 */
const RANGES = [
  { key: 'day', label: '일별', unit: '일', count: 14 },
  { key: 'week', label: '주별', unit: '주', count: 8 },
  { key: 'month', label: '월별', unit: '월', count: 6 },
]
const range = ref('week')
const target = ref(90)

const CATEGORIES = ['업무', '공부', '건강', '휴식']

// 시드 기반 의사난수 — 새로고침해도 같은 그래프가 나오도록 고정한다
function rand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
function buildSeries(key, count, base) {
  const rows = []
  for (let i = 0; i < count; i += 1) {
    const seed = base + i * 7.3
    const unitPlan = key === 'day' ? 300 : key === 'week' ? 1800 : 7200
    const planned = Math.round(unitPlan * (0.85 + rand(seed) * 0.3))
    const drift = 0.72 + rand(seed + 1.1) * 0.4 + (i / count) * 0.14
    const actual = Math.round(planned * Math.min(drift, 1.25))
    rows.push({ i, planned, actual, rate: Math.round((actual / planned) * 100) })
  }
  return rows
}

const activeRange = computed(() => RANGES.find((r) => r.key === range.value))
const series = computed(() => {
  const r = activeRange.value
  const base = r.key === 'day' ? 3.1 : r.key === 'week' ? 11.7 : 23.5
  return buildSeries(r.key, r.count, base)
})
const labels = computed(() => {
  const unit = activeRange.value.unit
  const n = series.value.length
  return series.value.map((_, i) => (i === n - 1 ? '이번 ' + unit : n - 1 - i + unit + ' 전'))
})

const rates = computed(() => series.value.map((s) => s.rate))
const mean = computed(() => rates.value.reduce((a, b) => a + b, 0) / rates.value.length)
const stdev = computed(() => {
  const m = mean.value
  const v = rates.value.reduce((a, b) => a + (b - m) * (b - m), 0) / rates.value.length
  return Math.sqrt(v) || 1
})

// 최소제곱 회귀로 추세 기울기(구간당 %p)를 구한다
const slope = computed(() => {
  const n = rates.value.length
  const mx = (n - 1) / 2
  const my = mean.value
  let num = 0
  let den = 0
  rates.value.forEach((y0, x) => {
    num += (x - mx) * (y0 - my)
    den += (x - mx) * (x - mx)
  })
  return den ? num / den : 0
})

// 정규분포 누적확률 근사(Abramowitz–Stegun)
function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}
const nextForecast = computed(() => mean.value + slope.value * (rates.value.length / 2))
const probability = computed(() => Math.round(normalCdf((nextForecast.value - target.value) / stdev.value) * 100))

const totalPlanned = computed(() => series.value.reduce((a, b) => a + b.planned, 0))
const totalActual = computed(() => series.value.reduce((a, b) => a + b.actual, 0))
const syncRate = computed(() => Math.round((totalActual.value / totalPlanned.value) * 100))

const W = 640
const H = 180
const maxVal = computed(() => Math.max(...series.value.map((s) => Math.max(s.planned, s.actual))) * 1.1)
const barW = computed(() => W / series.value.length)
function y(v) {
  return H - (v / maxVal.value) * H
}
function rateY(rate) {
  return 100 - Math.min(rate, 130) * 0.7
}
const ratePath = computed(() => series.value.map((s, i) => (i + 0.5) * barW.value + ',' + rateY(s.rate)).join(' '))

const drill = computed(() => {
  const share = [0.42, 0.24, 0.2, 0.14]
  return CATEGORIES.map((name, idx) => {
    const planned = Math.round(totalPlanned.value * share[idx])
    const actual = Math.round(planned * (0.82 + rand(idx * 3.7 + 5) * 0.45))
    return { name, planned, actual, diff: actual - planned, rate: Math.round((actual / planned) * 100) }
  })
})
function hm(min) {
  return Math.floor(min / 60) + '시간 ' + (min % 60) + '분'
}
</script>

<template>
  <div class="page-tools">
    <div class="filter">
      <button v-for="r in RANGES" :key="r.key" :class="{ selected: range === r.key }" @click="range = r.key">{{ r.label }}</button>
    </div>
    <label style="display: flex; align-items: center; gap: 8px; margin: 0; font-size: 0.875rem">
      목표 달성률
      <input type="range" min="60" max="120" step="5" v-model.number="target" style="width: 140px" />
      <b class="figure">{{ target }}%</b>
    </label>
  </div>

  <div class="metrics" style="grid-template-columns: repeat(4, 1fr); margin: 16px 0">
    <article><span>싱크로율(누적)</span><b class="figure">{{ syncRate }}<small>%</small></b></article>
    <article><span>평균 달성률</span><b class="figure">{{ Math.round(mean) }}<small>%</small></b></article>
    <article>
      <span>추세</span>
      <b class="figure">{{ slope >= 0 ? '+' : '' }}{{ slope.toFixed(1) }}<small>%p/{{ activeRange.unit }}</small></b>
    </article>
    <article>
      <span>다음 {{ activeRange.unit }} 목표 달성 확률</span>
      <b class="figure">{{ probability }}<small>%</small></b>
    </article>
  </div>

  <section class="card" style="margin-bottom: 16px">
    <div class="head">
      <div>
        <h3 style="margin: 0">계획 대비 실제 · {{ activeRange.label }}</h3>
        <p style="margin: 4px 0 0">막대는 계획/실제 시간, 아래 선은 달성률 추이예요</p>
      </div>
      <span class="badge ok">계획 {{ hm(totalPlanned) }} · 실제 {{ hm(totalActual) }}</span>
    </div>

    <svg :viewBox="'0 0 ' + W + ' ' + H" class="compare-chart" preserveAspectRatio="none">
      <g v-for="(s, i) in series" :key="'b' + i">
        <rect :x="i * barW + barW * 0.16" :y="y(s.planned)" :width="barW * 0.32" :height="H - y(s.planned)" fill="var(--color-hairline)" />
        <rect :x="i * barW + barW * 0.52" :y="y(s.actual)" :width="barW * 0.32" :height="H - y(s.actual)" fill="var(--color-accent)" opacity="0.9" />
      </g>
    </svg>

    <svg viewBox="0 0 640 110" class="compare-chart" style="height: 110px" preserveAspectRatio="none">
      <line x1="0" :y1="rateY(target)" x2="640" :y2="rateY(target)" stroke="var(--color-muted)" stroke-width="1" stroke-dasharray="4 4" />
      <polyline :points="ratePath" fill="none" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle v-for="(s, i) in series" :key="'c' + i" :cx="(i + 0.5) * barW" :cy="rateY(s.rate)" r="3" fill="var(--color-canvas)" stroke="var(--color-accent)" stroke-width="2" />
    </svg>

    <div class="compare-axis">
      <span v-for="(l, i) in labels" :key="'l' + i">{{ range === 'day' && i % 3 !== 0 ? '' : l }}</span>
    </div>
    <div class="chart-legend">
      <span><i class="swatch plan"></i>계획</span>
      <span><i class="swatch actual"></i>실제</span>
      <span><i class="swatch dashed"></i>목표선 {{ target }}%</span>
    </div>
  </section>

  <section class="card">
    <h3>카테고리별 오차 드릴다운</h3>
    <div class="list" style="margin-top: 10px">
      <div class="list-head" style="grid-template-columns: 1fr 1fr 1fr 1.2fr"><span>카테고리</span><span>계획</span><span>실제</span><span>달성률</span></div>
      <div class="row" style="grid-template-columns: 1fr 1fr 1fr 1.2fr" v-for="d in drill" :key="d.name">
        <label>{{ d.name }}</label>
        <span class="figure">{{ hm(d.planned) }}</span>
        <span class="figure">{{ hm(d.actual) }}</span>
        <span>
          <b class="figure">{{ d.rate }}%</b>
          <small style="color: var(--color-muted)"> · {{ d.diff >= 0 ? '+' : '' }}{{ d.diff }}분</small>
        </span>
      </div>
    </div>
    <p class="form-note" style="margin-top: 12px">
      달성 확률은 최근 {{ series.length }}개 구간의 달성률 평균({{ Math.round(mean) }}%)과 표준편차({{ Math.round(stdev) }}%p)를 정규분포로 근사해 추정한 값이에요.
    </p>
  </section>
</template>
